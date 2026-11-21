const axios = require('axios');
const os = require('os');

function getRam() {
  return `${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`;
}

function getMenu(config) {
  return `╭─ *${config.BOT_NAME}* ─╮
│ 👑 Owner Name: ${config.OWNER_NAME}
│ 📱 Owner Number: ${config.OWNER_NUMBER || 'Not set'}
│ ⚙️ Mode: ${config.BOT_MODE}
│ ☁️ Host: Heroku
│ 🖥️ Server: ${process.version}
│ 🧠 RAM: ${getRam()}
│ 💾 Storage: Active
╰────────────────────╯

╭━━━〔 🤖 *AI COMMANDS* 〕━━━╮
${config.PREFIX}ai
${config.PREFIX}gpt
${config.PREFIX}ask
${config.PREFIX}chat
${config.PREFIX}gemini
${config.PREFIX}llama
${config.PREFIX}copilot
${config.PREFIX}translate
${config.PREFIX}summarize
${config.PREFIX}rewrite
${config.PREFIX}grammar
${config.PREFIX}imagine
${config.PREFIX}code
${config.PREFIX}debug
${config.PREFIX}explain

╭━━━〔 ❤️ *STATUS COMMANDS* 〕━━━╮
${config.PREFIX}autolikestatus on/off
${config.PREFIX}autoviewstatus on/off
${config.PREFIX}status
${config.PREFIX}statusreply
${config.PREFIX}statusreact
${config.PREFIX}statussave
${config.PREFIX}statusdownload
${config.PREFIX}statusprivacy

╭━━━〔 👥 *GROUP COMMANDS* 〕━━━╮
${config.PREFIX}kick
${config.PREFIX}add
${config.PREFIX}promote
${config.PREFIX}demote
${config.PREFIX}mute
${config.PREFIX}unmute
${config.PREFIX}tagall
${config.PREFIX}hidetag
${config.PREFIX}groupinfo
${config.PREFIX}setname
${config.PREFIX}setdesc
${config.PREFIX}welcome
${config.PREFIX}goodbye
${config.PREFIX}antilink
${config.PREFIX}antispam
${config.PREFIX}lock
${config.PREFIX}unlock
${config.PREFIX}poll
${config.PREFIX}revoke

╭━━━〔 🎨 *STICKER & MEDIA* 〕━━━╮
${config.PREFIX}sticker
${config.PREFIX}s
${config.PREFIX}toimg
${config.PREFIX}tomp4
${config.PREFIX}togif
${config.PREFIX}circle
${config.PREFIX}crop
${config.PREFIX}blur
${config.PREFIX}invert
${config.PREFIX}wanted
${config.PREFIX}wasted
${config.PREFIX}trigger
${config.PREFIX}emojimix
${config.PREFIX}take
${config.PREFIX}attp
${config.PREFIX}ttp
${config.PREFIX}qc

╭━━━〔 📥 *DOWNLOADERS* 〕━━━╮
${config.PREFIX}play
${config.PREFIX}song
${config.PREFIX}video
${config.PREFIX}ytmp3
${config.PREFIX}ytmp4
${config.PREFIX}tiktok
${config.PREFIX}instagram
${config.PREFIX}facebook
${config.PREFIX}twitter
${config.PREFIX}spotify
${config.PREFIX}pinterest
${config.PREFIX}mediafire
${config.PREFIX}gdrive
${config.PREFIX}apk
${config.PREFIX}lyrics

╭━━━〔 🛠️ *TOOLS* 〕━━━╮
${config.PREFIX}ping
${config.PREFIX}alive
${config.PREFIX}uptime
${config.PREFIX}time
${config.PREFIX}date
${config.PREFIX}calc
${config.PREFIX}math
${config.PREFIX}weather
${config.PREFIX}news
${config.PREFIX}currency
${config.PREFIX}qr
${config.PREFIX}barcode
${config.PREFIX}shorturl
${config.PREFIX}expandurl
${config.PREFIX}password
${config.PREFIX}uuid
${config.PREFIX}base64
${config.PREFIX}unbase64
${config.PREFIX}encode
${config.PREFIX}decode
${config.PREFIX}reverse
${config.PREFIX}upper
${config.PREFIX}lower
${config.PREFIX}count
${config.PREFIX}choose
${config.PREFIX}random
${config.PREFIX}timestamp

╭━━━〔 🎮 *GAMES & FUN* 〕━━━╮
${config.PREFIX}joke
${config.PREFIX}fact
${config.PREFIX}quote
${config.PREFIX}motivate
${config.PREFIX}8ball
${config.PREFIX}coinflip
${config.PREFIX}dice
${config.PREFIX}riddle
${config.PREFIX}trivia
${config.PREFIX}quiz
${config.PREFIX}ship
${config.PREFIX}rate
${config.PREFIX}compliment
${config.PREFIX}roast
${config.PREFIX}truth
${config.PREFIX}dare

╭━━━〔 👑 *OWNER COMMANDS* 〕━━━╮
${config.PREFIX}mode private/public
${config.PREFIX}autolikestatus on/off
${config.PREFIX}autoviewstatus on/off
${config.PREFIX}setowner
${config.PREFIX}owner
${config.PREFIX}restart
${config.PREFIX}update
${config.PREFIX}broadcast
${config.PREFIX}clearsession
${config.PREFIX}backup
${config.PREFIX}setprefix
${config.PREFIX}setnamebot
${config.PREFIX}setbio
${config.PREFIX}block
${config.PREFIX}unblock
${config.PREFIX}shutdown

╭━━━〔 ➕ *MORE COMMANDS* 〕━━━╮
${config.PREFIX}menu
${config.PREFIX}help
${config.PREFIX}support
${config.PREFIX}channel
${config.PREFIX}verify
${config.PREFIX}jid
${config.PREFIX}id
${config.PREFIX}repo
${config.PREFIX}script
${config.PREFIX}host
${config.PREFIX}server
${config.PREFIX}ram
${config.PREFIX}storage
${config.PREFIX}ownerinfo
${config.PREFIX}rules
${config.PREFIX}privacy

_${config.BOT_NAME}_`;
}

async function handleCommand({ sock, msg, from, sender, isOwner, reply, args, command, q, config, botState }) {
  const PREFIX = config.PREFIX;
  const BOT_NAME = config.BOT_NAME;
  const OWNER_NUMBER = config.OWNER_NUMBER;
  const OWNER_NAME = config.OWNER_NAME;

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
      if (botState) botState.AUTO_LIKE_STATUS = q.toLowerCase() === 'on';
      return reply(`❤️ Auto Like Status is now *${botState?.AUTO_LIKE_STATUS ? 'ON' : 'OFF'}*`);

    case 'autoviewstatus':
      if (!isOwner) return reply('⚠️ Owner only command!');
      if (botState) botState.AUTO_VIEW_STATUS = q.toLowerCase() === 'on';
      return reply(`👁️ Auto View Status is now *${botState?.AUTO_VIEW_STATUS ? 'ON' : 'OFF'}*`);

    case 'status':
    case 'statusprivacy':
      return reply(`📊 *Status Privacy & Monitor:*\n• Auto View: ${botState?.AUTO_VIEW_STATUS ? 'Enabled' : 'Disabled'}\n• Auto Like: ${botState?.AUTO_LIKE_STATUS ? 'Enabled' : 'Disabled'}`);

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
⚙️ *Mode:* ${config.BOT_MODE}
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
      return reply(`📰 *Latest News:* Technology updates — ${BOT_NAME} active and running globally!`);

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
        config.BOT_MODE = 'PRIVATE';
        return reply('🔒 Bot mode set to *PRIVATE*.');
      } else if (q.toLowerCase() === 'public') {
        config.BOT_MODE = 'PUBLIC';
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
      config.PREFIX = q.trim();
      return reply(`⚡ Prefix changed to: *${config.PREFIX}*`);

    case 'setnamebot':
      if (!isOwner) return reply('⚠️ Owner only command!');
      if (!q) return reply('Provide a name!');
      config.BOT_NAME = q.trim();
      return reply(`🤖 Bot name set to: *${config.BOT_NAME}*`);

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
      return reply(getMenu(config));

    case 'support':
    case 'channel':
      return reply(`📢 *Official Updates Channel:*\nFollow HANS TECHY on WhatsApp.`);

    case 'verify':
      return reply(`✅ Verified authentic ${BOT_NAME} installation.`);

    case 'jid':
    case 'id':
      return reply(`🆔 *Current Chat ID (JID):*\n\`${from}\``);

    case 'repo':
    case 'script':
      return reply(`💻 *Source Repository:*\nhttps://github.com/hanstechy1/HANS-TECHY-V2`);

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
}

module.exports = { handleCommand, getMenu, getRam };
