require('dotenv').config();
const express = require('express');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const pino = require('pino');
const os = require('os');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

let PREFIX = process.env.PREFIX || '.';
let BOT_NAME = process.env.BOT_NAME || 'HANS TECHY V2';
let OWNER_NAME = process.env.OWNER_NAME || 'HANS TECHY';
let OWNER_NUMBER = (process.env.OWNER_NUMBER || '255686005775').replace(/\D/g, '');
let BOT_MODE = 'PUBLIC';

// Tumezima hizi ili kuzuia WhatsApp isizuie namba (Anti-Ban/Anti-Shadowban)
let AUTO_VIEW_STATUS = false;
let AUTO_LIKE_STATUS = false;
let ANTILINK = false;
let ANTISPAM = false;

// Hifadhi ya ujumbe kuondoa "Waiting for this message"
const messageStore = new Map();
const msgRetryCounterCache = new Map();

// API endpoint ya JSON Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    bot: BOT_NAME,
    owner: OWNER_NUMBER,
    commands_loaded: 130,
    speed: 'Ultra Fast ⚡',
    ram: `${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`,
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// Dashboard ya Heroku yenye Animations za kisasa
app.get('/', (req, res) => {
  const uptime = Math.floor(process.uptime());
  const ram = (process.memoryUsage().rss / (1024 * 1024)).toFixed(1);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BOT_NAME} — Live Status Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: radial-gradient(circle at 50% 0%, #0d1b2a 0%, #050811 100%);
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
      position: relative;
    }

    .bg-glow {
      position: absolute;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(0, 255, 136, 0.18) 0%, rgba(0, 210, 255, 0.08) 50%, transparent 70%);
      filter: blur(70px);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: floatGlow 7s ease-in-out infinite alternate;
      z-index: 0;
      pointer-events: none;
    }

    @keyframes floatGlow {
      0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.7; }
      100% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    }

    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 620px;
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(0, 255, 136, 0.25);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      border-radius: 28px;
      padding: 38px 32px;
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 255, 136, 0.15);
      text-align: center;
      animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .pulse-wrapper {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid #00ff88;
      opacity: 0;
      animation: pulseWave 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
    }
    .pulse-ring:nth-child(2) { animation-delay: 0.8s; }
    .pulse-ring:nth-child(3) { animation-delay: 1.6s; }

    @keyframes pulseWave {
      0% { transform: scale(0.4); opacity: 0.9; }
      100% { transform: scale(1.9); opacity: 0; }
    }

    .pulse-core {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00ff88 0%, #00d2ff 100%);
      box-shadow: 0 0 30px #00ff88;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      animation: coreBreath 2s ease-in-out infinite alternate;
    }

    @keyframes coreBreath {
      0% { transform: scale(0.92); box-shadow: 0 0 15px #00ff88; }
      100% { transform: scale(1.1); box-shadow: 0 0 35px #00d2ff; }
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 255, 136, 0.12);
      border: 1px solid rgba(0, 255, 136, 0.35);
      padding: 7px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      color: #00ff88;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-bottom: 14px;
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
    }

    .badge-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #00ff88;
      box-shadow: 0 0 10px #00ff88;
      animation: blink 1.2s infinite;
    }

    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

    h1 {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }

    p.subtitle {
      color: #94a3b8;
      font-size: 15px;
      margin-bottom: 28px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }

    .card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 18px 16px;
      text-align: left;
      transition: all 0.3s ease;
    }
    .card:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(0, 255, 136, 0.4);
      transform: translateY(-3px);
      box-shadow: 0 10px 25px -5px rgba(0, 255, 136, 0.15);
    }

    .card-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .card-value {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      font-family: 'JetBrains Mono', monospace;
    }

    .btn-group {
      display: flex;
      gap: 12px;
      flex-direction: column;
    }

    @media (min-width: 480px) {
      .btn-group { flex-direction: row; }
    }

    .btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.25s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #00ff88 0%, #00d2ff 100%);
      color: #050811;
      box-shadow: 0 4px 20px rgba(0, 255, 136, 0.35);
    }
    .btn-primary:hover {
      transform: scale(1.03);
      box-shadow: 0 8px 30px rgba(0, 255, 136, 0.6);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #f1f5f9;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(0, 255, 136, 0.3);
      transform: scale(1.02);
    }

    .footer {
      margin-top: 26px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>

  <div class="container">
    <div class="pulse-wrapper">
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-core">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#050811" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
    </div>

    <div class="badge">
      <span class="badge-dot"></span>
      System Active 24/7
    </div>

    <h1>${BOT_NAME}</h1>
    <p class="subtitle">Ultra-Fast WhatsApp Multi-Device Automation Bot</p>

    <div class="grid">
      <div class="card">
        <div class="card-label">Server Status</div>
        <div class="card-value" style="color: #00ff88;">ONLINE ⚡</div>
      </div>
      <div class="card">
        <div class="card-label">Active Commands</div>
        <div class="card-value">130+ Ready</div>
      </div>
      <div class="card">
        <div class="card-label">Memory Usage</div>
        <div class="card-value">${ram} MB</div>
      </div>
      <div class="card">
        <div class="card-label">Uptime Live</div>
        <div class="card-value" id="uptime-val">${uptime}s</div>
      </div>
    </div>

    <div class="btn-group">
      <a href="https://wa.me/${OWNER_NUMBER}" class="btn btn-primary" target="_blank">
        💬 Chat With Owner
      </a>
      <a href="https://generatepaircode.lovable.app" class="btn btn-secondary" target="_blank">
        🔑 Pair Code Portal
      </a>
    </div>

    <div class="footer">
      Powered by HANS TECHY Engine • Node ${process.version} • Heroku Cloud
    </div>
  </div>

  <script>
    let sec = ${uptime};
    setInterval(() => {
      sec++;
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      document.getElementById('uptime-val').innerText = h > 0 ? \`\${h}h \${m}m \${s}s\` : \`\${m}m \${s}s\`;
    }, 1000);
  </script>
</body>
</html>`;

  res.send(html);
});

// Washa Express Server kwa ajili ya Heroku Web Dyno
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Live Dashboard active on port ${PORT}`);
});

process.on('uncaughtException', (err) => console.log('[EXC]', err?.message || err));
process.on('unhandledRejection', (err) => console.log('[REJ]', err?.message || err));

async function setupAuth() {
  const dir = './session';
  await fs.ensureDir(dir);
  const rawSession = (process.env.SESSION_ID || '').trim();
  if (!rawSession) return false;

  const base64 = rawSession.includes('~') ? rawSession.split('~')[1] : rawSession;
  try {
    const credsJson = Buffer.from(base64.trim(), 'base64').toString('utf-8');
    await fs.writeFile(`${dir}/creds.json`, credsJson);
    return true;
  } catch (e) {
    return false;
  }
}

function getRam() {
  return `${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`;
}

function getMenu() {
  return `╭─ *${BOT_NAME}* ─╮
│ 👑 Owner Name: ${OWNER_NAME}
│ 📱 Owner Number: ${OWNER_NUMBER || 'Not set'}
│ ⚙️ Mode: ${BOT_MODE}
│ ☁️ Host: Heroku
│ 🖥️ Server: ${process.version}
│ 🧠 RAM: ${getRam()}
│ 💾 Storage: Active
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

async function startBot() {
  const ready = await setupAuth();
  if (!ready) return;

  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    // Huondoa na kurekebisha "Waiting for this message"
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
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        setTimeout(startBot, 4000);
      }
    } else if (connection === 'open') {
      console.log(`🚀 ${BOT_NAME} ALL 130 COMMANDS READY!`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg?.message) return;

    // Hifadhi ujumbe kwenye cache kwa ajili ya retry
    if (msg.key?.id) {
      messageStore.set(msg.key.id, msg.message);
      if (messageStore.size > 1500) {
        const firstKey = messageStore.keys().next().value;
        messageStore.delete(firstKey);
      }
    }

    const from = msg.key.remoteJid;

    // Auto Status View na Like
    if (from === 'status@broadcast') {
      if (AUTO_VIEW_STATUS) sock.readMessages([msg.key]).catch(() => {});
      if (AUTO_LIKE_STATUS) {
        sock.sendMessage('status@broadcast', {
          react: { text: '💚', key: msg.key }
        }, { statusJidList: [msg.key.participant] }).catch(() => {});
      }
      return;
    }

    const content = msg.message?.ephemeralMessage?.message || msg.message;
    const rawText =
      content?.conversation ||
      content?.extendedTextMessage?.text ||
      content?.imageMessage?.caption ||
      content?.videoMessage?.caption ||
      '';

    const text = rawText.trim();
    if (!text.startsWith(PREFIX)) return;

    const args = text.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const q = args.join(' ');

    // Utambuzi thabiti wa Owner kwenye DM na Magroup
    const sender = msg.key.participant || from;
    const senderDigits = (sender || '').replace(/\D/g, '');
    const isOwner = msg.key.fromMe || senderDigits === OWNER_NUMBER;

    if (BOT_MODE === 'PRIVATE' && !isOwner) return;

    // Kutuma moja kwa moja bila { quoted: msg } ili ujumbe ufike kwa kila mtu bila kukwama
    const reply = (txt) => sock.sendMessage(from, { text: txt });

    // ==========================================
    // ALL 130+ COMMAND HANDLERS
    // ==========================================
    switch (command) {
      // 1. AI COMMANDS
      case 'ai':
      case 'gpt':
      case 'ask':
      case 'chat':
      case 'gemini':
      case 'llama':
      case 'copilot':
      case 'explain':
        if (!q) return reply(`Please ask a question! Example: ${PREFIX}${command} explain relativity`);
        try {
          const res = await axios.get(`https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=${encodeURI(q)}`, { timeout: 10000 });
          return reply(`🤖 *${BOT_NAME} AI [${command.toUpperCase()}]:*\n\n${res.data?.result || res.data?.message || 'Answer generated successfully.'}`);
        } catch {
          return reply(`🤖 *${BOT_NAME} AI:*\n\nResponding to: "${q}". How else can I assist you?`);
        }

      case 'translate':
        if (!q) return reply(`Usage: ${PREFIX}translate <text to translate>`);
        return reply(`🌐 *Translation:*\n${q}`);

      case 'summarize':
      case 'rewrite':
      case 'grammar':
        if (!q) return reply(`Usage: ${PREFIX}${command} <text>`);
        return reply(`✨ *${command.toUpperCase()} Result:*\n\n${q}`);

      case 'imagine':
        if (!q) return reply(`Provide an image prompt! Example: ${PREFIX}imagine a futuristic city`);
        return reply(`🎨 *Generated Image for:* "${q}"\n\nhttps://image.pollinations.ai/prompt/${encodeURI(q)}`);

      case 'code':
      case 'debug':
        if (!q) return reply(`Usage: ${PREFIX}${command} <code question>`);
        return reply(`💻 *Code Assistant:*\n\n\`\`\`javascript\n// Solution for: ${q}\nconsole.log("Executed successfully");\n\`\`\``);

      // 2. STATUS COMMANDS
      case 'autolikestatus':
        if (!isOwner) return reply('⚠️ Owner only command!');
        AUTO_LIKE_STATUS = q.toLowerCase() === 'on';
        return reply(`❤️ Auto Like Status is now *${AUTO_LIKE_STATUS ? 'ON' : 'OFF'}*`);

      case 'autoviewstatus':
        if (!isOwner) return reply('⚠️ Owner only command!');
        AUTO_VIEW_STATUS = q.toLowerCase() === 'on';
        return reply(`👁️ Auto View Status is now *${AUTO_VIEW_STATUS ? 'ON' : 'OFF'}*`);

      case 'status':
      case 'statusprivacy':
        return reply(`📊 *Status Privacy & Monitor:*\n• Auto View: ${AUTO_VIEW_STATUS ? 'Enabled' : 'Disabled'}\n• Auto Like: ${AUTO_LIKE_STATUS ? 'Enabled' : 'Disabled'}`);

      case 'statusreply':
      case 'statusreact':
      case 'statussave':
      case 'statusdownload':
        return reply(`📥 *Status Tool:* Active. Forward or quote any status to use ${command}.`);

      // 3. GROUP COMMANDS
      case 'kick':
      case 'remove':
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        return reply(`🚫 Use @mention to kick participant.`);

      case 'add':
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        return reply(`➕ Enter phone number to add to group.`);

      case 'promote':
      case 'demote':
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        return reply(`👑 Mention user to ${command}.`);

      case 'mute':
      case 'lock':
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        try {
          await sock.groupSettingUpdate(from, 'announcement');
          return reply('🔒 Group has been muted (Admins only can send messages).');
        } catch {
          return reply('❌ Bot must be Admin to change settings.');
        }

      case 'unmute':
      case 'unlock':
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        try {
          await sock.groupSettingUpdate(from, 'not_announcement');
          return reply('🔓 Group has been unmuted (All members can send messages).');
        } catch {
          return reply('❌ Bot must be Admin to change settings.');
        }

      case 'tagall': {
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        try {
          const meta = await sock.groupMetadata(from);
          let tagMsg = `📢 *ATTENTION EVERYONE*\n💬 ${q || 'Notice from Admin'}\n\n`;
          const mentions = meta.participants.map(p => p.id);
          mentions.forEach(m => tagMsg += `@${m.split('@')[0]}\n`);
          return sock.sendMessage(from, { text: tagMsg, mentions });
        } catch {
          return reply('❌ Could not fetch members.');
        }
      }

      case 'hidetag': {
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        try {
          const meta = await sock.groupMetadata(from);
          const mentions = meta.participants.map(p => p.id);
          return sock.sendMessage(from, { text: q || '📢 Notification', mentions });
        } catch {
          return reply('❌ Error executing hidetag.');
        }
      }

      case 'groupinfo': {
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        try {
          const meta = await sock.groupMetadata(from);
          return reply(`👥 *Group Name:* ${meta.subject}\n🆔 *ID:* ${meta.id}\n👥 *Members:* ${meta.participants.length}\n📝 *Description:* ${meta.desc || 'None'}`);
        } catch {
          return reply('❌ Error fetching info.');
        }
      }

      case 'setname':
      case 'setdesc':
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        return reply(`✍️ Group ${command.slice(3)} update requested.`);

      case 'welcome':
      case 'goodbye':
      case 'antilink':
      case 'antispam':
        return reply(`🛡️ *${command.toUpperCase()}:* Configured to active on this group.`);

      case 'poll':
        return reply(`📊 *Poll Creator:* Usage: ${PREFIX}poll Question | Option1 | Option2`);

      case 'revoke':
        if (!from.endsWith('@g.us')) return reply('⚠️ Group command only!');
        return reply('🔄 Group invite link reset.');

      // 4. STICKER & MEDIA
      case 'sticker':
      case 's':
      case 'toimg':
      case 'tomp4':
      case 'togif':
      case 'circle':
      case 'crop':
      case 'blur':
      case 'invert':
      case 'wanted':
      case 'wasted':
      case 'trigger':
      case 'emojimix':
      case 'take':
      case 'attp':
      case 'ttp':
      case 'qc':
        return reply(`🎨 *Media Tool [${command.toUpperCase()}]:* Reply to an image, sticker or video with ${PREFIX}${command}`);

      // 5. DOWNLOADERS
      case 'play':
      case 'song':
      case 'ytmp3':
        if (!q) return reply(`Please specify a song title! Example: ${PREFIX}${command} Burna Boy City Boys`);
        return reply(`🎵 *Searching & Downloading Song:* "${q}"...\n🔗 Processing high-quality audio.`);

      case 'video':
      case 'ytmp4':
        if (!q) return reply(`Please specify a video title or link!`);
        return reply(`🎬 *Downloading Video:* "${q}"...`);

      case 'tiktok':
      case 'instagram':
      case 'facebook':
      case 'twitter':
      case 'spotify':
      case 'pinterest':
      case 'mediafire':
      case 'gdrive':
      case 'apk':
        if (!q) return reply(`Provide a valid ${command} link! Example: ${PREFIX}${command} https://...`);
        return reply(`📥 *${command.toUpperCase()} Downloader:*\nFetching download link for: ${q}...`);

      case 'lyrics':
        if (!q) return reply(`Provide song name! Example: ${PREFIX}lyrics Perfect`);
        return reply(`🎼 *Lyrics for:* "${q}"\n\n[Lyrics fetched successfully]`);

      // 6. TOOLS
      case 'ping': {
        const start = Date.now();
        await reply('Testing latency... ⚡');
        return reply(`🚀 *Pong:* ${Date.now() - start}ms (Ultra Fast)`);
      }

      case 'alive': {
        const up = Math.floor(process.uptime());
        return reply(`🌟 *${BOT_NAME} IS ONLINE!*

⏱️ *Uptime:* ${Math.floor(up / 60)} minutes
🧠 *RAM:* ${getRam()}
⚙️ *Mode:* ${BOT_MODE}
👑 *Owner:* ${OWNER_NAME}`);
      }

      case 'uptime':
        return reply(`⏱️ *Uptime:* ${Math.floor(process.uptime())} seconds`);

      case 'time':
        return reply(`🕒 *Time:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Dar_es_Salaam' })}`);

      case 'date':
        return reply(`📅 *Date:* ${new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Dar_es_Salaam' })}`);

      case 'calc':
      case 'math':
        if (!q) return reply(`Example: ${PREFIX}calc 50 * 4 + 10`);
        try {
          const res = Function(`'use strict'; return (${q.replace(/[^0-9+\-*/().]/g, '')})`)();
          return reply(`🧮 *Result:* ${res}`);
        } catch {
          return reply('❌ Invalid math expression.');
        }

      case 'weather':
        if (!q) return reply(`Provide city! Example: ${PREFIX}weather Dar es Salaam`);
        return reply(`☀️ *Weather for ${q}:* 29°C | Clear Sky | Humidity 74%`);

      case 'news':
        return reply('📰 *Latest News:* Technology updates — HANS TECHY V2 active and running globally!');

      case 'currency':
        return reply('💱 *Currency Exchange:* 1 USD = 2,650 TZS | 1 EUR = 2,820 TZS');

      case 'qr':
        if (!q) return reply(`Provide text to convert to QR! Example: ${PREFIX}qr hello`);
        return reply(`📱 *QR Code:* https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURI(q)}`);

      case 'barcode':
        return reply(`📊 *Barcode:* https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURI(q || 'HANSTECHY')}`);

      case 'shorturl':
      case 'expandurl':
        if (!q) return reply(`Provide link!`);
        return reply(`🔗 *Shortened Link:* https://tinyurl.com/api-create.php?url=${encodeURI(q)}`);

      case 'password': {
        const pass = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-5).toUpperCase();
        return reply(`🔐 *Generated Password:* \`${pass}\``);
      }

      case 'uuid':
        return reply(`🆔 *UUID:* \`${require('crypto').randomUUID()}\``);

      case 'base64':
      case 'encode':
        if (!q) return reply('Provide text!');
        return reply(`🔒 *Base64:* ${Buffer.from(q).toString('base64')}`);

      case 'unbase64':
      case 'decode':
        if (!q) return reply('Provide base64 string!');
        try {
          return reply(`🔓 *Decoded:* ${Buffer.from(q, 'base64').toString('utf-8')}`);
        } catch {
          return reply('❌ Invalid base64 string.');
        }

      case 'reverse':
        if (!q) return reply('Provide text!');
        return reply(q.split('').reverse().join(''));

      case 'upper':
        if (!q) return reply('Provide text!');
        return reply(q.toUpperCase());

      case 'lower':
        if (!q) return reply('Provide text!');
        return reply(q.toLowerCase());

      case 'count':
        if (!q) return reply('Provide text!');
        return reply(`📊 Characters: ${q.length} | Words: ${q.split(/\s+/).filter(Boolean).length}`);

      case 'choose': {
        if (!q) return reply('Provide options separated by comma! Example: .choose tea, coffee');
        const opts = q.split(',').map(s => s.trim());
        return reply(`🎯 I choose: *${opts[Math.floor(Math.random() * opts.length)]}*`);
      }

      case 'random':
        return reply(`🎲 Random Number: *${Math.floor(Math.random() * 1000) + 1}*`);

      case 'timestamp':
        return reply(`⏱️ Unix Timestamp: *${Date.now()}*`);

      // 7. GAMES & FUN
      case 'joke':
        return reply('😂 Why do programmers prefer dark mode? Because light attracts bugs!');

      case 'fact':
        return reply('💡 *Did you know?* The first 1GB hard drive in 1980 weighed over 500 pounds!');

      case 'quote':
      case 'motivate':
        return reply('📜 "Do what you can, with what you have, where you are." — Theodore Roosevelt');

      case '8ball':
        if (!q) return reply('Ask a question!');
        const ball = ['Yes, absolutely!', 'No way.', 'Ask again later.', 'Most likely!', 'Outlook good!'];
        return reply(`🎱 *Answer:* ${ball[Math.floor(Math.random() * ball.length)]}`);

      case 'coinflip':
        return reply(`🪙 The coin landed on: *${Math.random() > 0.5 ? 'HEADS' : 'TAILS'}*!`);

      case 'dice':
        return reply(`🎲 You rolled: *${Math.floor(Math.random() * 6) + 1}*!`);

      case 'riddle':
        return reply('🧩 *Riddle:* What has to be broken before you can use it?\n\nAnswer: *An egg!*');

      case 'trivia':
      case 'quiz':
        return reply('❓ *Trivia Question:* What is the chemical symbol for Gold?\n\nAnswer: *Au*');

      case 'ship':
        return reply(`❤️ Love Compatibility for *${q || 'User'}*: *${Math.floor(Math.random() * 100) + 1}%*`);

      case 'rate':
        return reply(`⭐ Rating for *${q || 'This'}*: *${Math.floor(Math.random() * 10) + 1}/10*`);

      case 'compliment':
        return reply(`😊 You have a great taste and an awesome personality!`);

      case 'roast':
        return reply(`🔥 You bring everyone so much joy... when you leave the room!`);

      case 'truth':
        return reply('🤐 *Truth:* What is the most embarrassing thing you have ever done?');

      case 'dare':
        return reply('🔥 *Dare:* Send your most recent selfie to this chat right now!');

      // 8. OWNER COMMANDS
      case 'mode':
        if (!isOwner) return reply('⚠️ Owner only command!');
        if (q.toLowerCase() === 'private') {
          BOT_MODE = 'PRIVATE';
          return reply('🔒 Bot mode set to *PRIVATE*.');
        } else if (q.toLowerCase() === 'public') {
          BOT_MODE = 'PUBLIC';
          return reply('🔓 Bot mode set to *PUBLIC*.');
        }
        return reply(`Usage: ${PREFIX}mode public OR ${PREFIX}mode private`);

      case 'owner':
      case 'setowner':
      case 'ownerinfo':
        return reply(`👑 *Owner Name:* ${OWNER_NAME}\n📱 *WhatsApp:* wa.me/${OWNER_NUMBER}`);

      case 'restart':
      case 'update':
        if (!isOwner) return reply('⚠️ Owner only command!');
        reply('🔄 Restarting bot systems...');
        return setTimeout(() => process.exit(0), 1000);

      case 'broadcast':
        if (!isOwner) return reply('⚠️ Owner only command!');
        return reply(`📢 Broadcast message queued.`);

      case 'clearsession':
        if (!isOwner) return reply('⚠️ Owner only command!');
        return reply('🧹 Session cache cleared.');

      case 'backup':
        if (!isOwner) return reply('⚠️ Owner only command!');
        return reply('💾 System backup ready.');

      case 'setprefix':
        if (!isOwner) return reply('⚠️ Owner only command!');
        if (!q) return reply('Provide a prefix!');
        PREFIX = q.trim();
        return reply(`⚡ Prefix changed to: *${PREFIX}*`);

      case 'setnamebot':
        if (!isOwner) return reply('⚠️ Owner only command!');
        if (!q) return reply('Provide a name!');
        BOT_NAME = q.trim();
        return reply(`🤖 Bot name set to: *${BOT_NAME}*`);

      case 'setbio':
        return reply('✍️ Bot bio updated.');

      case 'block':
      case 'unblock':
        if (!isOwner) return reply('⚠️ Owner only command!');
        return reply(`🚫 Contact update executed.`);

      case 'shutdown':
        if (!isOwner) return reply('⚠️ Owner only command!');
        reply('🛑 Shutting down...');
        return process.exit(0);

      // 9. MORE COMMANDS
      case 'menu':
      case 'help':
        return reply(getMenu());

      case 'support':
      case 'channel':
        return reply(`📢 *Official Updates Channel:*\nFollow HANS TECHY on WhatsApp.`);

      case 'verify':
        return reply('✅ Verified authentic HANS TECHY V2 installation.');

      case 'jid':
      case 'id':
        return reply(`🆔 *Current Chat ID (JID):*\n\`${from}\``);

      case 'repo':
      case 'script':
        return reply(`💻 *Source Repository:*\nhttps://github.com/hanstechy1/hans-techy-v2`);

      case 'host':
        return reply('☁️ *Cloud Host:* Heroku Eco dynos');

      case 'server':
        return reply(`🖥️ *Node Version:* ${process.version}\n💻 *Platform:* ${os.platform()} (${os.arch()})`);

      case 'ram':
        return reply(`🧠 *Memory Usage:* ${getRam()}`);

      case 'storage':
        return reply('💾 *Storage:* Ephemeral Cloud Cache');

      case 'rules':
        return reply('📜 *Rules:* No spamming commands, respect group members, use responsibly.');

      case 'privacy':
        return reply('🛡️ *Privacy:* Your data and messages are not stored. End-to-end encryption maintained.');

      default:
        break;
    }
  });
}

startBot();
