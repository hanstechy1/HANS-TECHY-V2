require('dotenv').config();
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
const os = require('os');
const axios = require('axios');

// Mipangilio ya awali
let PREFIX = process.env.PREFIX || '.';
let BOT_NAME = process.env.BOT_NAME || 'HANS TECHY V2';
let OWNER_NAME = process.env.OWNER_NAME || 'HANS TECHY';
let OWNER_NUMBER = process.env.OWNER_NUMBER || '255686005775';
let BOT_MODE = 'PUBLIC'; // PUBLIC au PRIVATE
let AUTO_VIEW_STATUS = true;
let AUTO_LIKE_STATUS = true;

const rawSession = process.env.SESSION_ID || '';

// Kufungua Session ID
async function setupAuth() {
  const dir = './session';
  await fs.ensureDir(dir);

  if (!rawSession) {
    console.error('❌ TAFADHALI WEKA SESSION_ID KWENYE HEROKU CONFIG VARS!');
    process.exit(1);
  }

  const base64 = rawSession.includes('~') ? rawSession.split('~')[1] : rawSession;
  try {
    const creds = Buffer.from(base64, 'base64').toString('utf-8');
    await fs.writeFile(`${dir}/creds.json`, creds);
    console.log('✅ Session ID imefunguliwa kikamilifu!');
  } catch (err) {
    console.error('❌ Hitilafu kwenye Session ID:', err.message);
    process.exit(1);
  }
  return dir;
}

// Kupima RAM
function getRamUsage() {
  const ram = (process.memoryUsage().rss / (1024 * 1024)).toFixed(1);
  return `${ram} MB`;
}

// Menu Kamili ya HANS TECHY V2
function generateMenu() {
  return `╭─ *HANS TECHY V2* ─╮
│ 👑 Owner Name: ${OWNER_NAME}
│ 📱 Owner Number: ${OWNER_NUMBER || 'Haijawekwa'}
│ ⚙️ Mode: ${BOT_MODE}
│ ☁️ Host: Heroku
│ 🖥️ Server: ${process.version}
│ 🧠 RAM: ${getRamUsage()}
│ 💾 Storage: Haijapimwa
╰────────────────────╯

╭━━━〔 🤖 *AI COMMANDS* 〕━━━╮
${PREFIX}ai
${PREFIX}gpt
${PREFIX}ask
${PREFIX}chat
${PREFIX}gemini
${PREFIX}llama
${PREFIX}copilot
${PREFIX}translate
${PREFIX}summarize
${PREFIX}rewrite
${PREFIX}grammar
${PREFIX}imagine
${PREFIX}code
${PREFIX}debug
${PREFIX}explain

╭━━━〔 ❤️ *STATUS COMMANDS* 〕━━━╮
${PREFIX}autolikestatus on/off
${PREFIX}autoviewstatus on/off
${PREFIX}status
${PREFIX}statusreply
${PREFIX}statusreact
${PREFIX}statussave
${PREFIX}statusdownload
${PREFIX}statusprivacy

╭━━━〔 👥 *GROUP COMMANDS* 〕━━━╮
${PREFIX}kick
${PREFIX}add
${PREFIX}promote
${PREFIX}demote
${PREFIX}mute
${PREFIX}unmute
${PREFIX}tagall
${PREFIX}hidetag
${PREFIX}groupinfo
${PREFIX}setname
${PREFIX}setdesc
${PREFIX}welcome
${PREFIX}goodbye
${PREFIX}antilink
${PREFIX}antispam
${PREFIX}lock
${PREFIX}unlock
${PREFIX}poll
${PREFIX}revoke

╭━━━〔 🎨 *STICKER & MEDIA* 〕━━━╮
${PREFIX}sticker
${PREFIX}s
${PREFIX}toimg
${PREFIX}tomp4
${PREFIX}togif
${PREFIX}circle
${PREFIX}crop
${PREFIX}blur
${PREFIX}invert
${PREFIX}wanted
${PREFIX}wasted
${PREFIX}trigger
${PREFIX}emojimix
${PREFIX}take
${PREFIX}attp
${PREFIX}ttp
${PREFIX}qc

╭━━━〔 📥 *DOWNLOADERS* 〕━━━╮
${PREFIX}play
${PREFIX}song
${PREFIX}video
${PREFIX}ytmp3
${PREFIX}ytmp4
${PREFIX}tiktok
${PREFIX}instagram
${PREFIX}facebook
${PREFIX}twitter
${PREFIX}spotify
${PREFIX}pinterest
${PREFIX}mediafire
${PREFIX}gdrive
${PREFIX}apk
${PREFIX}lyrics

╭━━━〔 🛠️ *TOOLS* 〕━━━╮
${PREFIX}ping
${PREFIX}alive
${PREFIX}uptime
${PREFIX}time
${PREFIX}date
${PREFIX}calc
${PREFIX}math
${PREFIX}weather
${PREFIX}news
${PREFIX}currency
${PREFIX}qr
${PREFIX}barcode
${PREFIX}shorturl
${PREFIX}expandurl
${PREFIX}password
${PREFIX}uuid
${PREFIX}base64
${PREFIX}unbase64
${PREFIX}encode
${PREFIX}decode
${PREFIX}reverse
${PREFIX}upper
${PREFIX}lower
${PREFIX}count
${PREFIX}choose
${PREFIX}random
${PREFIX}timestamp

╭━━━〔 🎮 *GAMES & FUN* 〕━━━╮
${PREFIX}joke
${PREFIX}fact
${PREFIX}quote
${PREFIX}motivate
${PREFIX}8ball
${PREFIX}coinflip
${PREFIX}dice
${PREFIX}riddle
${PREFIX}trivia
${PREFIX}quiz
${PREFIX}ship
${PREFIX}rate
${PREFIX}compliment
${PREFIX}roast
${PREFIX}truth
${PREFIX}dare

╭━━━〔 👑 *OWNER COMMANDS* 〕━━━╮
${PREFIX}mode private/public
${PREFIX}autolikestatus on/off
${PREFIX}autoviewstatus on/off
${PREFIX}setowner
${PREFIX}owner
${PREFIX}restart
${PREFIX}update
${PREFIX}broadcast
${PREFIX}clearsession
${PREFIX}backup
${PREFIX}setprefix
${PREFIX}setnamebot
${PREFIX}setbio
${PREFIX}block
${PREFIX}unblock
${PREFIX}shutdown

╭━━━〔 ➕ *MORE COMMANDS* 〕━━━╮
${PREFIX}menu
${PREFIX}help
${PREFIX}support
${PREFIX}channel
${PREFIX}verify
${PREFIX}jid
${PREFIX}id
${PREFIX}repo
${PREFIX}script
${PREFIX}host
${PREFIX}server
${PREFIX}ram
${PREFIX}storage
${PREFIX}ownerinfo
${PREFIX}rules
${PREFIX}privacy

_HANS TECHY V2_`;
}

async function startHansBot() {
  const sessionDir = await setupAuth();
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();
  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log('Muunganisho umekatika, inaunganisha tena...');
        startHansBot();
      }
    } else if (connection === 'open') {
      console.log(`🚀 ${BOT_NAME} IMEWAKA NA IKO TAYARI KAZINI!`);
    }
  });

  // AUTO VIEW STATUS & AUTO LIKE STATUS
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;

    // Kusoma na kulike status kiotomatiki
    if (from === 'status@broadcast') {
      if (AUTO_VIEW_STATUS) {
        await sock.readMessages([msg.key]);
      }
      if (AUTO_LIKE_STATUS) {
        try {
          await sock.sendMessage('status@broadcast', {
            react: { text: '💚', key: msg.key }
          }, { statusJidList: [msg.key.participant] });
        } catch {}
      }
      return;
    }

    const isOwner = msg.key.fromMe || (from && from.includes(OWNER_NUMBER));

    // Kama iko mode ya PRIVATE, watu wengine wasiweze kuitumia
    if (BOT_MODE === 'PRIVATE' && !isOwner) return;

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      '';

    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');

    console.log(`[COMMAND] ${command} kutoka ${from}`);

    switch (command) {
      // MENU & MORE
      case 'menu':
      case 'help':
        await sock.sendMessage(from, { text: generateMenu() }, { quoted: msg });
        break;

      case 'ping': {
        const start = Date.now();
        await sock.sendMessage(from, { text: 'Testing speed... ⚡' }, { quoted: msg });
        const latency = Date.now() - start;
        await sock.sendMessage(from, { text: `🚀 *Pong:* ${latency}ms` }, { quoted: msg });
        break;
      }

      case 'alive': {
        const uptime = Math.floor(process.uptime());
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = uptime % 60;
        await sock.sendMessage(from, {
          text: `*${BOT_NAME} IS ALIVE!* 🌟\n\n⏱️ *Uptime:* ${h}h ${m}m ${s}s\n🧠 *RAM:* ${getRamUsage()}\n⚙️ *Mode:* ${BOT_MODE}\n👑 *Owner:* ${OWNER_NAME}`
        }, { quoted: msg });
        break;
      }

      case 'owner':
      case 'ownerinfo':
        await sock.sendMessage(from, {
          text: `👑 *Owner Name:* ${OWNER_NAME}\n📱 *WhatsApp:* wa.me/${OWNER_NUMBER}`
        }, { quoted: msg });
        break;

      case 'ram':
        await sock.sendMessage(from, { text: `🧠 *RAM Usage:* ${getRamUsage()}` }, { quoted: msg });
        break;

      case 'server':
        await sock.sendMessage(from, { text: `🖥️ *Node Server Version:* ${process.version}\n💻 *OS:* ${os.type()} ${os.release()}` }, { quoted: msg });
        break;

      // OWNER SETTINGS
      case 'mode':
        if (!isOwner) return sock.sendMessage(from, { text: '⚠️ Amri hii ni ya Owner pekee!' }, { quoted: msg });
        if (text.toLowerCase() === 'private') {
          BOT_MODE = 'PRIVATE';
          await sock.sendMessage(from, { text: '🔒 Bot imewekwa kuwa *PRIVATE*.' }, { quoted: msg });
        } else if (text.toLowerCase() === 'public') {
          BOT_MODE = 'PUBLIC';
          await sock.sendMessage(from, { text: '🔓 Bot imewekwa kuwa *PUBLIC*.' }, { quoted: msg });
        } else {
          await sock.sendMessage(from, { text: `Tumia: ${PREFIX}mode public AU ${PREFIX}mode private` }, { quoted: msg });
        }
        break;

      case 'autolikestatus':
        if (!isOwner) return sock.sendMessage(from, { text: '⚠️ Amri hii ni ya Owner pekee!' }, { quoted: msg });
        AUTO_LIKE_STATUS = text.toLowerCase() === 'on';
        await sock.sendMessage(from, { text: `❤️ Auto Like Status: *${AUTO_LIKE_STATUS ? 'ON' : 'OFF'}*` }, { quoted: msg });
        break;

      case 'autoviewstatus':
        if (!isOwner) return sock.sendMessage(from, { text: '⚠️ Amri hii ni ya Owner pekee!' }, { quoted: msg });
        AUTO_VIEW_STATUS = text.toLowerCase() === 'on';
        await sock.sendMessage(from, { text: `👁️ Auto View Status: *${AUTO_VIEW_STATUS ? 'ON' : 'OFF'}*` }, { quoted: msg });
        break;

      // GROUP COMMANDS
      case 'tagall': {
        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: 'Group pekee!' }, { quoted: msg });
        const metadata = await sock.groupMetadata(from);
        let tagMsg = `📢 *TAG ALL*\n💬 ${text || 'Hakuna ujumbe'}\n\n`;
        const mentions = metadata.participants.map(p => p.id);
        mentions.forEach(m => tagMsg += `@${m.split('@')[0]}\n`);
        await sock.sendMessage(from, { text: tagMsg, mentions }, { quoted: msg });
        break;
      }

      case 'hidetag': {
        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: 'Group pekee!' }, { quoted: msg });
        const metadata = await sock.groupMetadata(from);
        const mentions = metadata.participants.map(p => p.id);
        await sock.sendMessage(from, { text: text || '📢 Tangazo!', mentions });
        break;
      }

      // TOOLS
      case 'calc':
      case 'math':
        if (!text) return sock.sendMessage(from, { text: 'Weka hesabu! Mfano: .calc 5 * 10 + 2' }, { quoted: msg });
        try {
          const sanitized = text.replace(/[^0-9+\-*/().]/g, '');
          const result = Function(`'use strict'; return (${sanitized})`)();
          await sock.sendMessage(from, { text: `🧮 *Jibu:* ${result}` }, { quoted: msg });
        } catch {
          await sock.sendMessage(from, { text: '❌ Hesabu haijasomeka vizuri.' }, { quoted: msg });
        }
        break;

      case 'quote': {
        try {
          const res = await axios.get('https://api.quotable.io/random');
          await sock.sendMessage(from, { text: `📜 "${res.data.content}"\n— *${res.data.author}*` }, { quoted: msg });
        } catch {
          await sock.sendMessage(from, { text: '📜 "Elimu ni ufunguo wa maisha." — Methali' }, { quoted: msg });
        }
        break;
      }

      case 'joke': {
        await sock.sendMessage(from, { text: '😂 Kwa nini kuku alivuka barabara? Kufika upande wa pili!' }, { quoted: msg });
        break;
      }

      // AI COMMANDS (Mfano .ai / .gpt)
      case 'ai':
      case 'gpt':
      case 'ask':
        if (!text) return sock.sendMessage(from, { text: `Uliza swali! Mfano: ${PREFIX}ai Rais wa Tanzania ni nani?` }, { quoted: msg });
        await sock.sendMessage(from, { text: `🤖 *HANS TECHY AI:*\n\nNimepokea swali lako: "${text}".` }, { quoted: msg });
        break;

      default:
        break;
    }
  });
}

startHansBot();
