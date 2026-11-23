// bot.js
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');
const express = require('express');
const NodeCache = require('node-cache');
const config = require('./config');
const { handleCommand } = require('./command');

const app = express();
const PORT = config.PORT || 3000;
const messageStore = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

app.get('/', (req, res) => {
  res.send({ status: 'online', bot: config.BOT_NAME });
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

async function startBot() {
  const sessionPath = path.join(__dirname, 'session');
  await fs.ensureDir(sessionPath);

  if (config.SESSION_ID && !fs.existsSync(path.join(sessionPath, 'creds.json'))) {
    try {
      let raw = config.SESSION_ID.replace('HANS TECHY~', '').trim();
      const decoded = Buffer.from(raw, 'base64').toString('utf-8');
      fs.writeFileSync(path.join(sessionPath, 'creds.json'), decoded);
      console.log('Session restored successfully.');
    } catch (err) {
      console.error('Invalid SESSION_ID format:', err.message);
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    getMessage: async (key) => {
      const msg = messageStore.get(key.id);
      return msg || { conversation: 'Message not found' };
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log(`${config.BOT_NAME} connected successfully!`);
    }
  });

  // Anti-Call Handler
  sock.ev.on('call', async (calls) => {
    for (const call of calls) {
      if (call.status === 'offer') {
        await sock.rejectCall(call.id, call.from);
        await sock.sendMessage(call.from, {
          text: `⚠️ *${config.BOT_NAME} ANTI-CALL*\n\nCalls are not allowed on this bot number. Please send a text message instead.`
        });
      }
    }
  });

  // Anti-Delete Handler
  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      if (update.update && update.update.messageStubType === 68) {
        const deletedKey = update.key;
        const cached = messageStore.get(deletedKey.id);
        if (cached) {
          const sender = deletedKey.participant || deletedKey.remoteJid;
          const textContent =
            cached.conversation ||
            cached.extendedTextMessage?.text ||
            '[Media / Sticker / Image]';

          await sock.sendMessage(deletedKey.remoteJid, {
            text: `🗑️ *${config.BOT_NAME} ANTI-DELETE*\n\n👤 *Deleted by:* @${sender.split('@')[0]}\n📝 *Message:* ${textContent}`,
            mentions: [sender]
          });
        }
      }
    }
  });

  // Message Handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key?.id && msg.message) {
        messageStore.set(msg.key.id, msg.message);
      }
      await handleCommand(sock, msg);
    }
  });
}

startBot();
