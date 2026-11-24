/**
 * HANS TECHY V2 - Main Entry Point
 * Baileys multi-device WhatsApp socket lifecycle.
 */

require('dotenv').config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { handleMessage } = require('./bot');

const SESSION_DIR = path.join(__dirname, 'session');
const CREDS_PATH = path.join(SESSION_DIR, 'creds.json');
const OWNER_NUMBER = (process.env.OWNER_NUMBER || '').replace(/\D/g, '');

fs.mkdirSync(SESSION_DIR, {
  recursive: true,
  mode: 0o700
});

function restoreSessionFromEnv() {
  const sessionId = (process.env.SESSION_ID || '').trim();
  if (!sessionId) return;

  const separator = sessionId.indexOf('~');
  const encoded = separator >= 0
    ? sessionId.slice(separator + 1)
    : sessionId;

  if (!encoded || !/^[A-Za-z0-9_+/=-]+$/.test(encoded)) {
    throw new Error('SESSION_ID is not valid Base64 data.');
  }

  let parsed;

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    parsed = JSON.parse(decoded);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Session data must be a JSON object.');
    }
  } catch (error) {
    throw new Error(
      `SESSION_ID could not be decoded as valid Baileys JSON: ${error.message}`
    );
  }

  if (typeof parsed['creds.json'] === 'string') {
    let restored = 0;
    const sessionRoot = path.resolve(SESSION_DIR);

    for (const [relativeName, fileContents] of Object.entries(parsed)) {
      if (typeof fileContents !== 'string') continue;

      if (
        !relativeName ||
        path.isAbsolute(relativeName) ||
        relativeName.split(/[\\/]+/).some((part) =>
          !part ||
          part === '.' ||
          part === '..'
        )
      ) {
        throw new Error('SESSION_ID contains an unsafe auth file path.');
      }

      const target = path.resolve(SESSION_DIR, relativeName);

      if (
        target !== sessionRoot &&
        !target.startsWith(sessionRoot + path.sep)
      ) {
        throw new Error(
          'SESSION_ID contains an auth file outside the session directory.'
        );
      }

      if (fs.existsSync(target)) continue;

      fs.mkdirSync(path.dirname(target), {
        recursive: true,
        mode: 0o700
      });

      fs.writeFileSync(target, fileContents, {
        encoding: 'utf8',
        mode: 0o600,
        flag: 'wx'
      });

      restored += 1;
    }

    console.log(
      chalk.green(
        `Session backup restored; added ${restored} missing auth file(s).`
      )
    );

    return;
  }

  if (!fs.existsSync(CREDS_PATH)) {
    fs.writeFileSync(CREDS_PATH, JSON.stringify(parsed), {
      encoding: 'utf8',
      mode: 0o600,
      flag: 'wx'
    });

    console.log(
      chalk.green(
        'Legacy session credentials restored from SESSION_ID.'
      )
    );
  } else {
    console.log(
      chalk.yellow(
        'Existing local session found; legacy SESSION_ID was not allowed to overwrite it.'
      )
    );
  }
}

let activeSocket = null;
let starting = false;
let reconnectTimer = null;
let stopping = false;

function getReconnectDelay() {
  const configured = Number(process.env.RECONNECT_DELAY_MS);
  return Number.isFinite(configured) && configured >= 1000
    ? configured
    : 5000;
}

function scheduleReconnect() {
  if (stopping || reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;

    startBot().catch((error) => {
      console.error(chalk.red('Reconnect failed:'), error.message);
      scheduleReconnect();
    });
  }, getReconnectDelay());

  reconnectTimer.unref?.();
}

async function startBot() {
  if (starting || activeSocket || stopping) return;

  starting = true;

  try {
    restoreSessionFromEnv();

    const { state, saveCreds } =
      await useMultiFileAuthState(SESSION_DIR);

    const { version } =
      await fetchLatestBaileysVersion();

    const conn = makeWASocket({
      version,
      logger: pino({
        level: process.env.LOG_LEVEL || 'silent'
      }),
      printQRInTerminal: !state.creds?.registered,
      auth: state,
      browser: ['HANS TECHY V2', 'Safari', '3.0'],
      syncFullHistory: false
    });

    activeSocket = conn;
    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', async ({
      connection,
      lastDisconnect
    }) => {
      if (connection === 'open') {
        console.log(
          chalk.green(
            'HANS TECHY V2 connected successfully.'
          )
        );

        if (OWNER_NUMBER) {
          await conn.sendMessage(
            `${OWNER_NUMBER}@s.whatsapp.net`,
            {
              text:
                `*${process.env.BOT_NAME || 'HANS TECHY V2'} IS ONLINE!* 🚀\n` +
                `Prefix: ${process.env.PREFIX || '.'}\n` +
                `Mode: ${(process.env.MODE || 'public').toUpperCase()}`
            }
          ).catch(() => null);
        }
      }

      if (connection === 'close') {
        if (activeSocket === conn) {
          activeSocket = null;
        }

        const statusCode =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output?.statusCode
            : lastDisconnect?.error?.output?.statusCode;

        const loggedOut =
          statusCode === DisconnectReason.loggedOut;

        console.warn(
          chalk.yellow('WhatsApp connection closed:'),
          statusCode || 'unknown'
        );

        if (!loggedOut) {
          scheduleReconnect();
        } else {
          console.error(
            chalk.red(
              'WhatsApp logged out. Set a fresh SESSION_ID or relink the device.'
            )
          );
        }
      }
    });

    conn.ev.on('messages.upsert', (upsert) => {
      handleMessage(conn, upsert).catch((error) => {
        console.error('Message handler failure:', error);
      });
    });
  } finally {
    starting = false;
  }
}

async function shutdown(signal) {
  if (stopping) return;

  stopping = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  console.log(`Received ${signal}; shutting down.`);

  try {
    if (activeSocket?.ws?.close) {
      activeSocket.ws.close();
    }
  } catch (error) {
    console.error(
      'Socket shutdown error:',
      error.message
    );
  }

  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

startBot().catch((error) => {
  console.error(
    chalk.red('Fatal initialization error:'),
    error
  );

  scheduleReconnect();
});
