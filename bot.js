const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  proto
} = require('@whiskeysockets/baileys');
const axios = require('axios');
const NodeCache = require('node-cache');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const { handleCommand } = require('./command');

const msgRetryCounterCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const messageStore = new NodeCache({ stdTTL: 15 * 60, useClones: false });
const groupMetadataCache = new NodeCache({ stdTTL: 10 * 60, useClones: false });

const botStatus = {
  connected: false,
  startTime: Date.now(),
  user: null,
  reconnectAttempts: 0
};

async function downloadSessionCreds() {
  const sessionDir = path.join(__dirname, 'session');
  const credsPath = path.join(sessionDir, 'creds.json');

  if (fs.existsSync(credsPath)) {
    return true;
  }

  const rawSession = (config.SESSION_ID || '').trim();
  if (!rawSession) {
    console.error('[HANS TECHY V2] ❌ SESSION_ID is missing from Heroku Config Vars.');
    return false;
  }

  const sessionId32 = rawSession.replace(/^HANS\s*TECHY~/i, '').trim();
  if (sessionId32.length !== 32) {
    console.error('[HANS TECHY V2] ❌ Invalid SESSION_ID length. Must be 32 characters after HANS TECHY~');
    return false;
  }

  try {
    console.log('[HANS TECHY V2] 🔄 Fetching credentials from secure API...');
    const response = await axios.get(`${config.API_URL}/session?id=${sessionId32}`, {
      timeout: 15000
    });

    if (response.data && response.data.noiseKey) {
      await fs.ensureDir(sessionDir);
      await fs.writeJson(credsPath, response.data, { spaces: 2 });
      console.log('[HANS TECHY V2] ✅ Credentials loaded successfully.');
      return true;
    } else {
      console.error('[HANS TECHY V2] ❌ Invalid credentials payload received.');
      return false;
    }
  } catch (err) {
    console.error('[HANS TECHY V2] ❌ Session fetch error:', err.response?.data?.error || err.message);
    return false;
  }
}

async function startBot() {
  const sessionDir = path.join(__dirname, 'session');
  const ready = await downloadSessionCreds();

  if (!ready) {
    console.error('[HANS TECHY V2] 🛑 Cannot launch WhatsApp socket without session.');
    return;
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({
    version: [2, 3000, 1017531234]
  }));

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['HANS TECHY V2', 'Safari', '2.0.0'],
    syncFullHistory: false,
    msgRetryCounterCache,
    getMessage: async (key) => {
      if (key.id && messageStore.has(key.id)) {
        return messageStore.get(key.id);
      }
      return proto.Message.fromObject({});
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      botStatus.connected = true;
      botStatus.reconnectAttempts = 0;
      botStatus.user = sock.user ? sock.user.id.split(':')[0] : 'Unknown';
      console.log(`[HANS TECHY V2] 🟢 Bot Online! Account: ${botStatus.user}`);

      try {
        const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
        await sock.sendMessage(ownerJid, {
          text: `╭─━─━「 *HANS TECHY V2* 」─━─━\n│ 🤖 *BOT STATUS:* ONLINE\n│ 👑 *Owner:* ${config.OWNER_NAME}\n│ ⚡ *Prefix:* ${config.PREFIX}\n╰─━─━─━─━─━─━─━─━─━─━─━─━─━`
        });
      } catch (_) {}
    }

    if (connection === 'close') {
      botStatus.connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      console.log(`[HANS TECHY V2] 🔴 Connection closed (${code || 'unknown'}).`);

      if (shouldReconnect) {
        botStatus.reconnectAttempts += 1;
        const delay = Math.min(botStatus.reconnectAttempts * 3000, 30000);
        setTimeout(() => startBot(), delay);
      } else {
        console.error('[HANS TECHY V2] 🛑 Logged out. Session expired. Clearing cache.');
        await fs.remove(sessionDir).catch(() => {});
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !messages || !messages.length) return;

    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key && msg.key.id) messageStore.set(msg.key.id, msg.message);
      if (msg.key && msg.key.remoteJid === 'status@broadcast') continue;

      try {
        await handleCommand(sock, msg, { groupCache: groupMetadataCache, botStatus });
      } catch (err) {
        console.error('[HANS TECHY V2] Command error:', err.message);
      }
    }
  });

  return sock;
}

module.exports = { startBot, botStatus };
