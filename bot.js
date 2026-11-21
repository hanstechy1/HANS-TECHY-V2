require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const pino = require('pino');
const config = require('./config');
const { handleCommand } = require('./command');

// Kumbukumbu ya kuzuia "Waiting for this message"
const messageStore = new Map();
const msgRetryCounterCache = new Map();
const groupCache = new Map();

let botStatus = {
  connected: false,
  user: null
};

async function setupAuth() {
  const dir = './session';
  await fs.ensureDir(dir);
  const rawSession = (config.SESSION_ID || '').trim();
  if (!rawSession) return false;

  const base64 = rawSession.includes('~') ? rawSession.split('~')[1] : rawSession;
  try {
    const credsJson = Buffer.from(base64.trim(), 'base64').toString('utf-8');
    await fs.writeFile(`${dir}/creds.json`, credsJson);
    return true;
  } catch (e) {
    console.error('Kosa la kusoma SESSION_ID:', e.message);
    return false;
  }
}

async function startBot() {
  const ready = await setupAuth();
  if (!ready) {
    console.log('⚠️ SESSION_ID haikuwekwa au si sahihi.');
    return;
  }

  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    
    // Hizi mbili zinajibu ombi la decryption mara moja
    msgRetryCounterCache,
    getMessage: async (key) => {
      if (messageStore.has(key.id)) {
        return messageStore.get(key.id);
      }
      return undefined;
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      botStatus.connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        setTimeout(startBot, 4000);
      }
    } else if (connection === 'open') {
      botStatus.connected = true;
      botStatus.user = sock.user?.id ? sock.user.id.split(':')[0] : 'Active';
      console.log(`🚀 ${config.BOT_NAME} imeunganishwa kikamilifu!`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg?.message) return;

    // Hifadhi ujumbe unaoingia kwenye cache
    if (msg.key?.id) {
      messageStore.set(msg.key.id, msg.message);
      if (messageStore.size > 2000) {
        const firstKey = messageStore.keys().next().value;
        messageStore.delete(firstKey);
      }
    }

    const from = msg.key.remoteJid;

    // Function ya kutuma ujumbe inayotatua "Waiting for this message" kwa kila mtu
    const reply = async (txt) => {
      try {
        // 1. Simu inajiandaa na kuweka session tayari (Typing effect)
        await sock.sendPresenceUpdate('composing', from).catch(() => {});
        await new Promise((res) => setTimeout(res, 400)); // Sekunde 0.4 kamilisha handshake

        // 2. Kutuma ujumbe ukiwa quoted na ujumbe wa mtumaji
        const sent = await sock.sendMessage(from, { text: txt }, { quoted: msg });

        // 3. Hifadhi ujumbe uliotumwa ili simu ikituma retry iuone mara moja
        if (sent?.key?.id && sent?.message) {
          messageStore.set(sent.key.id, sent.message);
          if (messageStore.size > 2000) {
            const firstKey = messageStore.keys().next().value;
            messageStore.delete(firstKey);
          }
        }
        
        // Zima typing
        await sock.sendPresenceUpdate('paused', from).catch(() => {});
        return sent;
      } catch (err) {
        console.error('Kosa la kutuma jibu:', err?.message || err);
      }
    };

    // Peleka ujumbe kwenye command handler
    await handleCommand(sock, msg, reply, { messageStore, groupCache });
  });
}

module.exports = { startBot, botStatus };
