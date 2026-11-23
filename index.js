/**
 * HANS TECHY V2 - Main Entry Point (English)
 * Baileys Multi-Device WhatsApp Socket Setup & Lifecycle
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

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

/**
 * Decode SESSION_ID if provided in environment variables
 */
function restoreSessionFromEnv() {
  const sessionId = process.env.SESSION_ID;
  const credsPath = path.join(SESSION_DIR, 'creds.json');

  if (sessionId && !fs.existsSync(credsPath)) {
    try {
      console.log(chalk.blue('ℹ️ Restoring session credentials from SESSION_ID...'));
      // Remove custom prefix if present (e.g., HANS~, HANS_TECHY~)
      const cleanSession = sessionId.includes('~') ? sessionId.split('~')[1] : sessionId;
      const decoded = Buffer.from(cleanSession, 'base64').toString('utf-8');
      fs.writeFileSync(credsPath, decoded);
      console.log(chalk.green('✅ Session successfully saved to session/creds.json'));
    } catch (err) {
      console.error(chalk.red('❌ Failed to restore SESSION_ID:'), err.message);
    }
  }
}

async function startBot() {
  restoreSessionFromEnv();

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
    version: [2, 3000, 1015901307],
    isLatest: true
  }));

  console.log(chalk.cyan(`
╔══════════════════════════════════════╗
║        HANS TECHY V2 BOT             ║
║  Multi-Device WhatsApp Userbot       ║
╚══════════════════════════════════════╝`));
  console.log(chalk.yellow(`Using Baileys version: ${version.join('.')} (Latest: ${isLatest})`));

  const conn = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !process.env.SESSION_ID,
    auth: state,
    browser: ['HANS TECHY V2', 'Safari', '3.0'],
    syncFullHistory: false
  });

  // Save session credentials whenever updated
  conn.ev.on('creds.update', saveCreds);

  // Monitor connection updates
  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !process.env.SESSION_ID) {
      console.log(chalk.yellow('📱 Scan this QR Code with your WhatsApp:'));
    }

    if (connection === 'open') {
      console.log(chalk.green('========================================='));
      console.log(chalk.green('🚀 HANS TECHY V2 CONNECTED SUCCESSFULLY!'));
      console.log(chalk.green(`🤖 Bot Name: ${process.env.BOT_NAME || 'HANS TECHY V2'}`));
      console.log(chalk.green(`👑 Owner Number: ${process.env.OWNER_NUMBER || 'Not configured'}`));
      console.log(chalk.green('========================================='));

      // Send greeting notification to owner
      const ownerJid = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      if (ownerJid && ownerJid.length > 15) {
        await conn.sendMessage(ownerJid, {
          text: `*${process.env.BOT_NAME || 'HANS TECHY V2'} IS ONLINE!* 🚀\n\n` +
                `✅ Your WhatsApp bot is now active and ready.\n` +
                `⚙️ *Prefix:* ${process.env.PREFIX || '.'}\n` +
                `🔒 *Mode:* ${(process.env.MODE || 'public').toUpperCase()}\n\n` +
                `Type *${process.env.PREFIX || '.'}menu* to see all available commands!`
        }).catch(() => null);
      }
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode
        : null;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(chalk.red(`⚠️ Connection closed (Reason: ${statusCode || 'Unknown'}).`));

      if (shouldReconnect) {
        console.log(chalk.yellow('🔄 Reconnecting in 5 seconds...'));
        setTimeout(startBot, 5000);
      } else {
        console.log(chalk.red('❌ Logged out from WhatsApp. Please provide a fresh SESSION_ID or scan QR again.'));
      }
    }
  });

  // Handle incoming messages
  conn.ev.on('messages.upsert', async (upsert) => {
    await handleMessage(conn, upsert);
  });
}

// Start application
startBot().catch((err) => {
  console.error(chalk.red('Fatal initialization error:'), err);
});
