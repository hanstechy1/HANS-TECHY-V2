const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { handleCommand } = require('./commands');

// Cache ya kuhifadhi ujumbe kuzuia "Waiting for this message"
const messageStore = new Map();
const sessionDir = path.resolve('session');

let botStatus = {
  connected: false,
  uptime: Date.now(),
  user: null
};

// Kufungua SESSION_ID
function prepareSession() {
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
  if (config.SESSION_ID && !fs.existsSync(path.join(sessionDir, 'creds.json'))) {
    try {
      let raw = config.SESSION_ID.trim();
      if (raw.startsWith('HANS-TECHY~')) {
        const parts = raw.split('~');
        raw = parts.slice(parts[1] === 'v2' ? 2 : 1).join('~');
      }
      const decoded = Buffer.from(raw, 'base64').toString('utf-8');
      fs.writeFileSync(path.join(sessionDir, 'creds.json'), decoded);
      console.log('Session creds.json imetengenezwa.');
    } catch (e) {
      console.error('Hitilafu ya kufungua SESSION_ID:', e.message);
    }
  }
}

async function startBot() {
  prepareSession();
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: false,
    getMessage: async (key) => {
      const msg = messageStore.get(key.id);
      return msg || undefined;
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      botStatus.connected = true;
      botStatus.user = sock.user?.id?.split(':')[0];
      console.log(`✅ Bot imeunganishwa kama: ${botStatus.user}`);
    } else if (connection === 'close') {
      botStatus.connected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Muunganisho umekatika. Inajaribu tena:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(startBot, 4000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      // Hifadhi ujumbe kwenye cache
      if (msg.key?.id && msg.message) {
        messageStore.set(msg.key.id, msg.message);
        if (messageStore.size > 1500) {
          const firstKey = messageStore.keys().next().value;
          messageStore.delete(firstKey);
        }
      }

      // Tuma kwenye command handler
      await handleCommand(sock, msg);
    }
  });

  return sock;
}

module.exports = { startBot, botStatus };
