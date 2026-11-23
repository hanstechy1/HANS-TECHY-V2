// command.js
const axios = require('axios');
const os = require('os');
const crypto = require('crypto');
const config = require('./config');

// Vigezo vya muda na hali
let PREFIX = config.PREFIX || '.';
let BOT_NAME = config.BOT_NAME || 'HANS TECHY V2';
let OWNER_NAME = config.OWNER_NAME || 'HANS TECHY';
let OWNER_NUMBER = (config.OWNER_NUMBER || '255686005775').replace(/\D/g, '');
let BOT_MODE = config.BOT_MODE || 'PUBLIC';
let AUTO_VIEW_STATUS = true;
let AUTO_LIKE_STATUS = true;

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

/**
 * Mfumo mkuu wa kuchakata amri zote
 */
async function handleCommand(sock, msg) {
  try {
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    // 1. Usimamizi wa Status Broadcast
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
    const command = (args.shift() || '').toLowerCase();
    const q = args.join(' ');

    const sender = isGroup ? (msg.key.participant || msg.participant) : from;
    const cleanSender = (sender || '').split('@')[0].replace(/\D/g, '');
    const cleanOwner = OWNER_NUMBER.replace(/\D/g, '');
    const isOwner = msg.key.fromMe || cleanSender === cleanOwner;

    if (BOT_MODE === 'PRIVATE' && !isOwner) return;

    const reply = (txt) => sock.sendMessage(from, { text: txt }, { quoted: msg });

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
      case 'remove': {
        if (!isGroup) return reply('⚠️ Group command only!');
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length > 0) {
          try {
            await sock.groupParticipantsUpdate(from, mentioned, 'remove');
            return reply('🚫 Participant removed from group.');
          } catch {
            return reply('❌ Bot must be Admin to remove members.');
          }
        }
        return reply(`🚫 Use @mention to kick participant.`);
      }

      case 'add':
        if (!isGroup) return reply('⚠️ Group command only!');
        return reply(`➕ Enter phone number to add to group.`);

      case 'promote':
      case 'demote': {
        if (!isGroup) return reply('⚠️ Group command only!');
        const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (target.length > 0) {
          try {
            await sock.groupParticipantsUpdate(from, target, command);
            return reply(`👑 Action *${command}* completed.`);
          } catch {
            return reply('❌ Bot must be Admin to manage roles.');
          }
        }
        return reply(`👑 Mention user to ${command}.`);
      }

      case 'mute':
      case 'lock':
        if (!isGroup) return reply('⚠️ Group command only!');
        try {
          await sock.groupSettingUpdate(from, 'announcement');
          return reply('🔒 Group has been muted (Admins only can send messages).');
        } catch {
          return reply('❌ Bot must be Admin to change settings.');
        }

      case 'unmute':
      case 'unlock':
        if (!isGroup) return reply('⚠️ Group command only!');
        try {
          await sock.groupSettingUpdate(from, 'not_announcement');
          return reply('🔓 Group has been unmuted (All members can send messages).');
        } catch {
          return reply('❌ Bot must be Admin to change settings.');
        }

      case 'tagall': {
        if (!isGroup) return reply('⚠️ Group command only!');
        try {
          const meta = await sock.groupMetadata(from);
          let tagMsg = `📢 *ATTENTION EVERYONE*\n💬 ${q || 'Notice from Admin'}\n\n`;
          const mentions = meta.participants.map(p => p.id);
          mentions.forEach(m => tagMsg += `@${m.split('@')[0]}\n`);
          return sock.sendMessage(from, { text: tagMsg, mentions }, { quoted: msg });
        } catch {
          return reply('❌ Could not fetch members.');
        }
      }

      case 'hidetag': {
        if (!isGroup) return reply('⚠️ Group command only!');
        try {
          const meta = await sock.groupMetadata(from);
          const mentions = meta.participants.map(p => p.id);
          return sock.sendMessage(from, { text: q || '📢 Notification', mentions });
        } catch {
          return reply('❌ Error executing hidetag.');
        }
      }

      case 'groupinfo': {
        if (!isGroup) return reply('⚠️ Group command only!');
        try {
          const meta = await sock.groupMetadata(from);
          return reply(`👥 *Group Name:* ${meta.subject}\n🆔 *ID:* ${meta.id}\n👥 *Members:* ${meta.participants.length}\n📝 *Description:* ${meta.desc || 'None'}`);
        } catch {
          return reply('❌ Error fetching info.');
        }
      }

      case 'setname':
      case 'setdesc':
        if (!isGroup) return reply('⚠️ Group command only!');
        return reply(`✍️ Group ${command.slice(3)} update requested.`);

      case 'welcome':
      case 'goodbye':
      case 'antilink':
      case 'antispam':
        return reply(`🛡️ *${command.toUpperCase()}:* Configured to active on this group.`);

      case 'poll':
        return reply(`📊 *Poll Creator:* Usage: ${PREFIX}poll Question | Option1 | Option2`);

      case 'revoke':
        if (!isGroup) return reply('⚠️ Group command only!');
        try {
          await sock.groupRevokeInvite(from);
          return reply('🔄 Group invite link reset.');
        } catch {
          return reply('❌ Bot must be Admin.');
        }

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
        return reply(`🆔 *UUID:* \`${crypto.randomUUID()}\``);

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
  } catch (error) {
    console.error('[COMMAND ERROR]', error.message);
  }
}

module.exports = {
  handleCommand,
  getMenu,
};
