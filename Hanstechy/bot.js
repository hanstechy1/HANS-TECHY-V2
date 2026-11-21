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

const botStatus = { connected: false, user: null };
const messageStore = new Map();
const msgRetryCounterCache = new Map();
const groupCache = new Map();

async function setupAuth() {
  const dir = './session';
  await fs.ensureDir(dir);
  if (!config.SESSION_ID) return false;

  const base64 = config.SESSION_ID.includes('~') ? config.SESSION_ID.split('~')[1] : config.SESSION_ID;
  try {
    const credsJson = Buffer.from(base64.trim(), 'base64').toString('utf-8');
    await fs.writeFile(`${dir}/creds.json`, credsJson);
    return true;
  } catch (e) {
    return false;
  }
}

async function startBot() {
  const ready = await setupAuth();
  if (!ready) {
    console.log('⚠️ SESSION_ID haikuwekwa kwenye Heroku Config Vars!');
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
    msgRetryCounterCache,
    getMessage: async (key) => messageStore.get(key.id)
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
      botStatus.user = sock.user?.id ? sock.user.id.split(':')[0] : config.OWNER_NUMBER;
      console.log(`🚀 ${config.BOT_NAME} imeunganishwa kikamilifu!`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg?.message) return;

    if (msg.key?.id) messageStore.set(msg.key.id, msg.message);
    const from = msg.key.remoteJid;
    if (from === 'status@broadcast') return;

    const content = msg.message?.ephemeralMessage?.message || msg.message;
    const rawText = content?.conversation || content?.extendedTextMessage?.text || content?.imageMessage?.caption || '';
    const text = rawText.trim();
    if (!text.startsWith(config.PREFIX)) return;

    const args = text.slice(config.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const q = args.join(' ');

    const sender = msg.key.participant || from;
    const senderDigits = (sender || '').replace(/\D/g, '');
    const isOwner = msg.key.fromMe || senderDigits === config.OWNER_NUMBER;

    const reply = async (txt) => sock.sendMessage(from, { text: txt });

    await handleCommand({ sock, msg, from, sender, isOwner, reply, args, command, q, config });
  });
}

module.exports = { startBot, botStatus };
