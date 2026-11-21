require('dotenv').config();
const express = require('express');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

let waStatus = 'INITIALIZING';
let waError = null;

// Ukifungua link ya Heroku itaonyesha hali halisi ya WhatsApp
app.get('/', (req, res) => {
  res.json({
    web_server: 'ONLINE',
    whatsapp_connection: waStatus,
    error_message: waError,
    bot_name: process.env.BOT_NAME || 'HANS TECHY V2',
    owner: process.env.OWNER_NUMBER || '255686005775'
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Server listening on port ${PORT}`);
});

process.on('uncaughtException', (err) => console.log('[EXCEPTION]', err?.message || err));
process.on('unhandledRejection', (err) => console.log('[REJECTION]', err?.message || err));

const PREFIX = process.env.PREFIX || '.';
const BOT_NAME = process.env.BOT_NAME || 'HANS TECHY V2';
const OWNER_NUMBER = (process.env.OWNER_NUMBER || '255686005775').replace(/\D/g, '');

async function setupAuth() {
  const dir = './session';
  await fs.ensureDir(dir);

  const rawSession = (process.env.SESSION_ID || '').trim();
  if (!rawSession) {
    waStatus = 'MISSING_SESSION_ID';
    waError = 'Weka SESSION_ID kwenye Heroku Settings -> Reveal Config Vars!';
    console.error('❌ ' + waError);
    return false;
  }

  // Toa HANS TECHY~ mbele kama ipo
  const base64 = rawSession.includes('~') ? rawSession.split('~')[1] : rawSession;
  try {
    const credsJson = Buffer.from(base64.trim(), 'base64').toString('utf-8');
    await fs.writeFile(`${dir}/creds.json`, credsJson);
    console.log('✅ Session creds.json imeundwa kikamilifu!');
    return true;
  } catch (e) {
    waStatus = 'INVALID_SESSION_ID';
    waError = 'Session ID haisomeki: ' + e.message;
    console.error('❌ ' + waError);
    return false;
  }
}

async function startBot() {
  const ready = await setupAuth();
  if (!ready) return;

  waStatus = 'CONNECTING_TO_WHATSAPP...';
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  let version = [2, 3000, 1015901307];
  try {
    const v = await fetchLatestBaileysVersion();
    if (v?.version) version = v.version;
  } catch {}

  const logger = pino({ level: 'info' });

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      waStatus = `DISCONNECTED (Code: ${statusCode || 'unknown'})`;
      waError = lastDisconnect?.error?.message || null;
      console.log(`❌ Muunganisho umefungwa. Code: ${statusCode}`);

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('🔄 Inaunganisha tena baada ya sekunde 5...');
        setTimeout(startBot, 5000);
      } else {
        waStatus = 'LOGGED_OUT';
        waError = 'Umeondolewa kwenye WhatsApp. Tengeneza Session ID mpya!';
      }
    } else if (connection === 'open') {
      waStatus = 'CONNECTED';
      waError = null;
      console.log(`🎉 ${BOT_NAME} IMEUNGANISHWA NA IKO ONLINE TAYARI!`);
    }
  });

  // KUSIKILIZA NA KUJIBU MESEJI
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return;
      const msg = messages[0];
      if (!msg?.message) return;

      const from = msg.key.remoteJid;

      // Kusoma Status
      if (from === 'status@broadcast') {
        await sock.readMessages([msg.key]);
        try {
          await sock.sendMessage('status@broadcast', {
            react: { text: '💚', key: msg.key }
          }, { statusJidList: [msg.key.participant] });
        } catch {}
        return;
      }

      // Kupata ujumbe kamili
      const content = msg.message?.ephemeralMessage?.message || msg.message;
      const text =
        content?.conversation ||
        content?.extendedTextMessage?.text ||
        content?.imageMessage?.caption ||
        '';

      const body = text.trim();
      if (!body.startsWith(PREFIX)) return;

      const args = body.slice(PREFIX.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();
      const q = args.join(' ');

      console.log(`⚡ Command imepokelewa: ${command} kutoka ${from}`);

      // Amri ya PING
      if (command === 'ping') {
        const start = Date.now();
        await sock.sendMessage(from, { text: `🚀 *Pong!* Kasi: ${Date.now() - start}ms` });
        return;
      }

      // Amri ya MENU
      if (command === 'menu' || command === 'help') {
        const menu = `╭─ *${BOT_NAME}* ─╮
│ 👑 Owner: ${OWNER_NUMBER}
│ ⚡ Prefix: [ ${PREFIX} ]
│ 🕒 Status: Online ✅
╰────────────────────╯

╭───「 *COMMANDS* 」
│ 🔹 *${PREFIX}ping* - Pima kasi
│ 🔹 *${PREFIX}alive* - Kuangalia bot
│ 🔹 *${PREFIX}menu* - Orodha ya amri
│ 🔹 *${PREFIX}owner* - Mawasiliano
╰────────────────────◆`;
        await sock.sendMessage(from, { text: menu });
        return;
      }

      // Amri ya ALIVE
      if (command === 'alive') {
        await sock.sendMessage(from, {
          text: `👋 *${BOT_NAME}* iko macho na inafanya kazi vizuri!`
        });
        return;
      }

      // Amri ya OWNER
      if (command === 'owner') {
        await sock.sendMessage(from, {
          text: `👑 *Owner:* wa.me/${OWNER_NUMBER}`
        });
        return;
      }

    } catch (err) {
      console.error('Hitilafu wakati wa kujibu:', err);
    }
  });
}

startBot();
