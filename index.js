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
const os = require('os');
const axios = require('axios');

// Web server for Heroku port binding
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    bot: process.env.BOT_NAME || 'HANS TECHY V2',
    owner: process.env.OWNER_NAME || 'HANS TECHY',
    uptime: `${Math.floor(process.uptime())}s`,
    message: 'HANS TECHY V2 is active and running 24/7 🚀'
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

process.on('uncaughtException', (err) => console.log('[ERROR]', err?.message || err));
process.on('unhandledRejection', (reason) => console.log('[REJECTION]', reason?.message || reason));

let PREFIX = process.env.PREFIX || '.';
let BOT_NAME = process.env.BOT_NAME || 'HANS TECHY V2';
let OWNER_NAME = process.env.OWNER_NAME || 'HANS TECHY';
let OWNER_NUMBER = process.env.OWNER_NUMBER || '255686005775';
let BOT_MODE = 'PUBLIC';
let AUTO_VIEW_STATUS = true;
let AUTO_LIKE_STATUS = true;

const rawSession = process.env.SESSION_ID || '';

async function setupAuth() {
  const dir = './session';
  await fs.ensureDir(dir);

  if (!rawSession) {
    console.error('⚠️ SESSION_ID is missing in Config Vars!');
    return false;
  }

  const base64 = rawSession.includes('~') ? rawSession.split('~')[1] : rawSession;
  try {
    const creds = Buffer.from(base64.trim(), 'base64').toString('utf-8');
    await fs.writeFile(`${dir}/creds.json`, creds);
    console.log('✅ Session loaded successfully!');
    return true;
  } catch (err) {
    console.error('❌ Error decoding SESSION_ID:', err.message);
    return false;
  }
}

function getRamUsage() {
  return `${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`;
}

function generateMenu() {
  return `╭─ *${BOT_NAME}* ─╮
│ 👑 Owner Name: ${OWNER_NAME}
│ 📱 Owner Number: ${OWNER_NUMBER}
│ ⚙️ Mode: ${BOT_MODE}
│ ☁️ Host: Heroku
│ 🖥️ Server: ${process.version}
│ 🧠 RAM: ${getRamUsage()}
│ 💾 Storage: Active
╰────────────────────╯

╭━━━〔 🤖 *AI COMMANDS* 〕━━━╮
${PREFIX}ai <query>
${PREFIX}gpt <query>
${PREFIX}ask <query>
${PREFIX}chat <text>
${PREFIX}translate <text>
${PREFIX}summarize <text>

╭━━━〔 ❤️ *STATUS COMMANDS* 〕━━━╮
${PREFIX}autolikestatus on/off
${PREFIX}autoviewstatus on/off

╭━━━〔 👥 *GROUP COMMANDS* 〕━━━╮
${PREFIX}tagall
${PREFIX}hidetag
${PREFIX}groupinfo

╭━━━〔 🛠️ *UTILITY TOOLS* 〕━━━╮
${PREFIX}ping
${PREFIX}alive
${PREFIX}calc <math>
${PREFIX}quote
${PREFIX}joke

╭━━━〔 👑 *OWNER COMMANDS* 〕━━━╮
${PREFIX}mode private/public
${PREFIX}owner

_HANS TECHY V2 — All rights reserved_`;
}

async function startBot() {
  const isAuthReady = await setupAuth();
  if (!isAuthReady) return;

  const sessionDir = './session';
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  let version = [2, 3000, 1015901307];
  try {
    const v = await fetchLatestBaileysVersion();
    if (v?.version) version = v.version;
  } catch (e) {
    console.log('Using default Baileys version...');
  }

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
        console.log('Reconnecting bot...');
        setTimeout(startBot, 5000);
      } else {
        console.log('❌ Logged out from WhatsApp.');
      }
    } else if (connection === 'open') {
      console.log(`🚀 ${BOT_NAME} IS CONNECTED AND ONLINE!`);
    }
  });

  // Listener ya meseji na command zote
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;

    // Auto Status View na Like
    if (from === 'status@broadcast') {
      if (AUTO_VIEW_STATUS) await sock.readMessages([msg.key]);
      if (AUTO_LIKE_STATUS) {
        try {
          await sock.sendMessage('status@broadcast', {
            react: { text: '💚', key: msg.key }
          }, { statusJidList: [msg.key.participant] });
        } catch {}
      }
      return;
    }

    const messageContent =
      msg.message?.ephemeralMessage?.message ||
      msg.message?.viewOnceMessage?.message ||
      msg.message;

    const body =
      messageContent?.conversation ||
      messageContent?.extendedTextMessage?.text ||
      messageContent?.imageMessage?.caption ||
      messageContent?.videoMessage?.caption ||
      '';

    const trimmed = body.trim();
    if (!trimmed.startsWith(PREFIX)) return;

    const args = trimmed.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');

    console.log(`[COMMAND RECEIVED] ${command} from ${from}`);

    const isOwner = msg.key.fromMe || (from && from.includes(OWNER_NUMBER));
    if (BOT_MODE === 'PRIVATE' && !isOwner) return;

    switch (command) {
      case 'menu':
      case 'help':
        await sock.sendMessage(from, { text: generateMenu() }, { quoted: msg });
        break;

      case 'ping': {
        const start = Date.now();
        await sock.sendMessage(from, { text: 'Testing speed... ⚡' }, { quoted: msg });
        await sock.sendMessage(from, { text: `🚀 *Pong:* ${Date.now() - start}ms` }, { quoted: msg });
        break;
      }

      case 'alive': {
        const up = Math.floor(process.uptime());
        await sock.sendMessage(from, {
          text: `🌟 *${BOT_NAME} IS ONLINE!*\n\n⏱️ *Uptime:* ${Math.floor(up / 60)} minutes\n🧠 *RAM:* ${getRamUsage()}\n👑 *Owner:* ${OWNER_NAME}`
        }, { quoted: msg });
        break;
      }

      case 'owner':
        await sock.sendMessage(from, { text: `👑 *Owner:* ${OWNER_NAME}\n📱 *WhatsApp:* wa.me/${OWNER_NUMBER}` }, { quoted: msg });
        break;

      case 'tagall': {
        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '⚠️ Group only command!' }, { quoted: msg });
        const metadata = await sock.groupMetadata(from);
        let tagMsg = `📢 *ATTENTION ALL MEMBERS*\n💬 ${text || 'Notice from Admin'}\n\n`;
        const mentions = metadata.participants.map(p => p.id);
        mentions.forEach(m => tagMsg += `@${m.split('@')[0]}\n`);
        await sock.sendMessage(from, { text: tagMsg, mentions }, { quoted: msg });
        break;
      }

      case 'calc':
      case 'math':
        if (!text) return sock.sendMessage(from, { text: `Example: ${PREFIX}calc 25 * 4 + 10` }, { quoted: msg });
        try {
          const sanitized = text.replace(/[^0-9+\-*/().]/g, '');
          const result = Function(`'use strict'; return (${sanitized})`)();
          await sock.sendMessage(from, { text: `🧮 *Result:* ${result}` }, { quoted: msg });
        } catch {
          await sock.sendMessage(from, { text: '❌ Invalid expression.' }, { quoted: msg });
        }
        break;

      case 'joke':
        await sock.sendMessage(from, { text: '😂 Why do programmers prefer dark mode? Because light attracts bugs!' }, { quoted: msg });
        break;

      case 'ai':
      case 'gpt':
      case 'ask':
        if (!text) return sock.sendMessage(from, { text: `Example: ${PREFIX}ai write a poem` }, { quoted: msg });
        await sock.sendMessage(from, { text: `🤖 *HANS TECHY AI:*\n\nYour question: "${text}".` }, { quoted: msg });
        break;

      default:
        break;
    }
  });
}

startBot();

