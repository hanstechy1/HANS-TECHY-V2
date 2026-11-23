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
const NodeCache = require('node-cache');
const config = require('./config');
const { handleCommand } = require('./command');

// Cache maalum za kuzuia "Waiting for this message"
const msgRetryCounterCache = new NodeCache({ stdTTL: 300, useClones: false });
const groupCache = new NodeCache({ stdTTL: 300, useClones: false });
const messageStore = new Map();

function saveMessageToStore(m) {
  if (m?.key?.id && m?.message) {
    messageStore.set(m.key.id, m.message);
    if (messageStore.size > 5000) {
      const firstKey = messageStore.keys().next().value;
      messageStore.delete(firstKey);
    }
  }
}

let botStatus = {
  connected: false,
  user: null
};

// Hifadhi creds.json mara moja tu bila kuharibu funguo mpya za WhatsApp
async function setupAuth() {
  const dir = './session';
  await fs.ensureDir(dir);
  
  if (await fs.pathExists(`${dir}/creds.json`)) {
    return true;
  }

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
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    msgRetryCounterCache,

    // Inaleta data za kundi mapema ili meseji za group zifunguke mara moja
    cachedGroupMetadata: async (jid) => {
      let data = groupCache.get(jid);
      if (!data) {
        try {
          data = await sock.groupMetadata(jid);
          groupCache.set(jid, data);
        } catch {}
      }
      return data;
    },

    // Inajibu maombi ya retry ya simu za wanachama
    getMessage: async (key) => {
      if (messageStore.has(key.id)) {
        return messageStore.get(key.id);
      }
      return undefined;
    }
  });

  // Hifadhi meseji zote zinazotumwa na bot (hata za picha/media)
  const rawSendMessage = sock.sendMessage.bind(sock);
  sock.sendMessage = async (...args) => {
    const sent = await rawSendMessage(...args);
    saveMessageToStore(sent);
    return sent;
  };

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      try {
        const data = await sock.groupMetadata(update.id);
        groupCache.set(update.id, data);
      } catch {}
    }
  });

  sock.ev.on('group-participants.update', async (ev) => {
    try {
      const data = await sock.groupMetadata(ev.id);
      groupCache.set(ev.id, data);
    } catch {}
  });

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
      console.log(`🚀 ${config.BOT_NAME || 'HANS TECHY'} imeunganishwa kikamilifu!`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg?.message) return;

    saveMessageToStore(msg);
    const from = msg.key.remoteJid;

    const reply = async (txt) => {
      try {
        await sock.sendPresenceUpdate('composing', from).catch(() => {});
        await new Promise((res) => setTimeout(res, 300));
        const sent = await sock.sendMessage(from, { text: txt }, { quoted: msg });
        await sock.sendPresenceUpdate('paused', from).catch(() => {});
        return sent;
      } catch (err) {
        console.error('Kosa la kutuma jibu:', err?.message || err);
      }
    };

    await handleCommand(sock, msg, reply, { messageStore, groupCache });
  });
}

module.exports = { startBot, botStatus };
