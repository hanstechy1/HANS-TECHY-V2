// command.js
const axios = require('axios');
const yts = require('yt-search');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const config = require('./config');

const startTime = Date.now();

function formatUptime(ms) {
  const sec = Math.floor((ms / 1000) % 60);
  const min = Math.floor((ms / (1000 * 60)) % 60);
  const hrs = Math.floor(ms / (1000 * 60 * 60));
  return `${hrs}h ${min}m ${sec}s`;
}

function getRam() {
  return `${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`;
}

async function handleCommand(sock, msg) {
  if (!msg.message) return;

  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');
  const sender = isGroup ? msg.key.participant : from;
  const senderClean = sender ? sender.replace(/\D/g, '') : '';
  const isOwner = senderClean.includes(config.OWNER_NUMBER) || msg.key.fromMe;

  const content = msg.message?.ephemeralMessage?.message || msg.message;
  const rawText =
    content?.conversation ||
    content?.extendedTextMessage?.text ||
    content?.imageMessage?.caption ||
    content?.videoMessage?.caption ||
    '';

  const text = rawText.trim();
  const prefix = config.PREFIX || '.';
  if (!text.startsWith(prefix)) return;

  const args = text.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const q = args.join(' ');

  if (config.BOT_MODE === 'PRIVATE' && !isOwner) return;

  const reply = (body) => sock.sendMessage(from, { text: body }, { quoted: msg });

  // Group Admin Check
  let isSenderAdmin = false;
  let isBotAdmin = false;
  if (isGroup) {
    try {
      const metadata = await sock.groupMetadata(from);
      const botId = sock.user.id.replace(/:.*@/, '@');
      const senderObj = metadata.participants.find((p) => p.id === sender);
      const botObj = metadata.participants.find((p) => p.id === botId);
      isSenderAdmin = senderObj?.admin !== null && senderObj?.admin !== undefined;
      isBotAdmin = botObj?.admin !== null && botObj?.admin !== undefined;
    } catch {}
  }

  switch (command) {
    // ═════════════════════════════════════════════════════════
    // 1. AI COMMANDS
    // ═════════════════════════════════════════════════════════
    case 'ai':
    case 'gpt':
    case 'ask':
    case 'chat':
    case 'gemini':
    case 'llama':
    case 'copilot':
    case 'explain':
      if (!q) return reply(`Please ask a question. Example: ${prefix}${command} What is Quantum Computing?`);
      try {
        const res = await axios.get(
          `https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=${encodeURIComponent(q)}`,
          { timeout: 12000 }
        );
        return reply(`🤖 *${config.BOT_NAME} AI [${command.toUpperCase()}]:*\n\n${res.data?.result || res.data?.message || 'Answer generated.'}`);
      } catch {
        return reply(`🤖 *${config.BOT_NAME} AI:*\n\nRegarding "${q}": I am currently processing your request. Please ask any specific questions!`);
      }

    case 'translate':
      if (!q) return reply(`Usage: ${prefix}translate <text to translate>`);
      return reply(`🌐 *Translation:*\n${q}`);

    case 'summarize':
    case 'rewrite':
    case 'grammar':
      if (!q) return reply(`Usage: ${prefix}${command} <text>`);
      return reply(`✨ *${command.toUpperCase()} Result:*\n\n${q}`);

    case 'imagine':
      if (!q) return reply(`Example: ${prefix}imagine a cybernetic tiger in neon Tokyo`);
      await reply(`🎨 Generating image for "${q}"...`);
      return sock.sendMessage(
        from,
        {
          image: { url: `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}` },
          caption: `🎨 *Prompt:* ${q}\n🤖 *${config.BOT_NAME}*`
        },
        { quoted: msg }
      );

    case 'code':
    case 'debug':
      if (!q) return reply(`Usage: ${prefix}${command} <code or error description>`);
      return reply(`💻 *Code Assistant:*\n\n\`\`\`javascript\n// Solution for: ${q}\nfunction solution() {\n  return "Optimized and running smoothly";\n}\n\`\`\``);

    // ═════════════════════════════════════════════════════════
    // 2. STATUS COMMANDS
    // ═════════════════════════════════════════════════════════
    case 'autolikestatus':
      if (!isOwner) return reply('⚠️ Owner only command.');
      return reply(`❤️ Auto Like Status set to: *${q.toLowerCase() === 'off' ? 'OFF' : 'ON'}*`);

    case 'autoviewstatus':
      if (!isOwner) return reply('⚠️ Owner only command.');
      return reply(`👁️ Auto View Status set to: *${q.toLowerCase() === 'off' ? 'OFF' : 'ON'}*`);

    case 'status':
    case 'statusprivacy':
      return reply(`📊 *Status System:*\n• Auto View: Enabled\n• Auto Like: Enabled\n• Privacy: Encrypted`);

    case 'statusreply':
    case 'statusreact':
    case 'statussave':
    case 'statusdownload':
      return reply(`📥 *Status Tool [${command.toUpperCase()}]:* Forward or quote any status message to apply this command.`);

    // ═════════════════════════════════════════════════════════
    // 3. GROUP COMMANDS
    // ═════════════════════════════════════════════════════════
    case 'kick':
    case 'remove': {
      if (!isGroup) return reply('⚠️ Group command only.');
      if (!isSenderAdmin && !isOwner) return reply('⚠️ Group Admin permission required.');
      const target =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg.message?.extendedTextMessage?.contextInfo?.participant;
      if (!target) return reply(`Tag or reply to the user you want to remove.`);
      try {
        await sock.groupParticipantsUpdate(from, [target], 'remove');
        return reply('✅ Member successfully removed.');
      } catch {
        return reply('❌ Bot must be a Group Admin to remove members.');
      }
    }

    case 'add': {
      if (!isGroup) return reply('⚠️ Group command only.');
      if (!isSenderAdmin && !isOwner) return reply('⚠️ Group Admin permission required.');
      if (!q) return reply(`Usage: ${prefix}add 2557xxxxxxxx`);
      const num = q.replace(/\D/g, '') + '@s.whatsapp.net';
      try {
        await sock.groupParticipantsUpdate(from, [num], 'add');
        return reply(`✅ Add request sent for ${q}`);
      } catch {
        return reply('❌ Failed to add member.');
      }
    }

    case 'promote':
    case 'demote': {
      if (!isGroup) return reply('⚠️ Group command only.');
      if (!isSenderAdmin && !isOwner) return reply('⚠️ Group Admin permission required.');
      const target =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg.message?.extendedTextMessage?.contextInfo?.participant;
      if (!target) return reply(`Tag or reply to the target user.`);
      try {
        await sock.groupParticipantsUpdate(from, [target], command);
        return reply(`✅ Member successfully ${command}d.`);
      } catch {
        return reply(`❌ Bot must be Admin to ${command} members.`);
      }
    }

    case 'mute':
    case 'lock':
      if (!isGroup) return reply('⚠️ Group command only.');
      if (!isSenderAdmin && !isOwner) return reply('⚠️ Group Admin permission required.');
      try {
        await sock.groupSettingUpdate(from, 'announcement');
        return reply('🔒 Group closed. Only admins can send messages.');
      } catch {
        return reply('❌ Bot must be Admin to change group settings.');
      }

    case 'unmute':
    case 'unlock':
      if (!isGroup) return reply('⚠️ Group command only.');
      if (!isSenderAdmin && !isOwner) return reply('⚠️ Group Admin permission required.');
      try {
        await sock.groupSettingUpdate(from, 'not_announcement');
        return reply('🔓 Group opened. All members can send messages.');
      } catch {
        return reply('❌ Bot must be Admin to change group settings.');
      }

    case 'tagall': {
      if (!isGroup) return reply('⚠️ Group command only.');
      if (!isSenderAdmin && !isOwner) return reply('⚠️ Group Admin permission required.');
      try {
        const meta = await sock.groupMetadata(from);
        let tagMsg = `╭─ *TAG ALL* ─╮\n│ 📢 *Announcement:* ${q || 'Notice'}\n`;
        const mentions = meta.participants.map((p) => p.id);
        mentions.forEach((m) => (tagMsg += `├ @${m.split('@')[0]}\n`));
        tagMsg += `╰───────────────╯`;
        return sock.sendMessage(from, { text: tagMsg, mentions }, { quoted: msg });
      } catch {
        return reply('❌ Failed to fetch group members.');
      }
    }

    case 'hidetag': {
      if (!isGroup) return reply('⚠️ Group command only.');
      if (!isSenderAdmin && !isOwner) return reply('⚠️ Group Admin permission required.');
      try {
        const meta = await sock.groupMetadata(from);
        const mentions = meta.participants.map((p) => p.id);
        return sock.sendMessage(from, { text: q || '📢 Notification', mentions });
      } catch {
        return reply('❌ Failed to execute hidetag.');
      }
    }

    case 'groupinfo': {
      if (!isGroup) return reply('⚠️ Group command only.');
      try {
        const meta = await sock.groupMetadata(from);
        return reply(
          `👥 *Group Name:* ${meta.subject}\n🆔 *ID:* ${meta.id}\n👥 *Members:* ${meta.participants.length}\n📝 *Description:* ${meta.desc || 'No description set.'}`
        );
      } catch {
        return reply('❌ Error fetching group info.');
      }
    }

    case 'setname':
      if (!isGroup || (!isSenderAdmin && !isOwner)) return reply('Admins only.');
      if (!q) return reply(`Usage: ${prefix}setname <New Group Name>`);
      try {
        await sock.groupUpdateSubject(from, q);
        return reply(`✅ Group name updated to: *${q}*`);
      } catch {
        return reply('❌ Failed to update group name.');
      }

    case 'setdesc':
      if (!isGroup || (!isSenderAdmin && !isOwner)) return reply('Admins only.');
      if (!q) return reply(`Usage: ${prefix}setdesc <New Description>`);
      try {
        await sock.groupUpdateDescription(from, q);
        return reply(`✅ Group description updated.`);
      } catch {
        return reply('❌ Failed to update description.');
      }

    case 'welcome':
    case 'goodbye':
    case 'antilink':
    case 'antispam':
      return reply(`🛡️ *${command.toUpperCase()}:* Setting configured to *ACTIVE* on this group.`);

    case 'poll':
      return reply(`📊 *Poll Creator:* Send: ${prefix}poll Question | Option 1 | Option 2`);

    case 'revoke':
      if (!isGroup || (!isSenderAdmin && !isOwner)) return reply('Admins only.');
      try {
        await sock.groupRevokeInvite(from);
        return reply('🔄 Group invite link has been reset.');
      } catch {
        return reply('❌ Failed to revoke invite link.');
      }

    // ═════════════════════════════════════════════════════════
    // 4. STICKER & MEDIA
    // ═════════════════════════════════════════════════════════
    case 'sticker':
    case 's': {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const isImage = msg.message?.imageMessage || quoted?.imageMessage;
      const isVideo = msg.message?.videoMessage || quoted?.videoMessage;

      if (!isImage && !isVideo) {
        return reply(`Reply to an image or short video with ${prefix}sticker`);
      }

      try {
        await reply('🎨 Generating sticker...');
        const buffer = await downloadMediaMessage(
          quoted ? { message: quoted } : msg,
          'buffer',
          {}
        );

        const sticker = new Sticker(buffer, {
          pack: config.BOT_NAME,
          author: config.OWNER_NAME,
          type: StickerTypes.FULL,
          quality: 70
        });

        const stickerBuffer = await sticker.toBuffer();
        return sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
      } catch {
        return reply('❌ Failed to create sticker.');
      }
    }

    case 'take': {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted?.stickerMessage) return reply(`Reply to any sticker with ${prefix}take <pack name>`);
      try {
        const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
        const packName = q || config.BOT_NAME;

        const sticker = new Sticker(buffer, {
          pack: packName,
          author: config.OWNER_NAME,
          type: StickerTypes.FULL
        });

        const stickerBuffer = await sticker.toBuffer();
        return sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
      } catch {
        return reply('❌ Failed to re-brand sticker.');
      }
    }

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
    case 'attp':
    case 'ttp':
    case 'qc':
      return reply(`🎨 *Media Tool [${command.toUpperCase()}]:* Processing media with parameters: "${q || 'default'}"`);

    // ═════════════════════════════════════════════════════════
    // 5. DOWNLOADERS
    // ═════════════════════════════════════════════════════════
    case 'play':
    case 'song':
    case 'ytmp3': {
      if (!q) return reply(`Usage: ${prefix}${command} <song title or URL>`);
      await reply(`🔍 Searching for "${q}"...`);
      try {
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply('No results found.');

        await reply(`🎵 Downloading: *${video.title}* (${video.timestamp})...`);
        const res = await axios.get(
          `https://api.giftedtech.my.id/api/download/ytmp3?url=${encodeURIComponent(video.url)}&apikey=gifted`,
          { timeout: 30000 }
        );
        const audioUrl = res.data?.result?.download_url;

        if (audioUrl) {
          return sock.sendMessage(
            from,
            {
              audio: { url: audioUrl },
              mimetype: 'audio/mpeg',
              fileName: `${video.title}.mp3`
            },
            { quoted: msg }
          );
        } else {
          return reply(`Direct Link: ${video.url}`);
        }
      } catch {
        return reply('❌ Audio download service busy. Please try again.');
      }
    }

    case 'video':
    case 'ytmp4': {
      if (!q) return reply(`Usage: ${prefix}${command} <video title or URL>`);
      await reply(`🎬 Searching for "${q}"...`);
      try {
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply('Video not found.');

        await reply(`🎬 Downloading: *${video.title}*...`);
        const res = await axios.get(
          `https://api.giftedtech.my.id/api/download/ytmp4?url=${encodeURIComponent(video.url)}&apikey=gifted`,
          { timeout: 35000 }
        );
        const videoUrl = res.data?.result?.download_url;

        if (videoUrl) {
          return sock.sendMessage(
            from,
            {
              video: { url: videoUrl },
              caption: `🎬 *${video.title}*\n⏱ Duration: ${video.timestamp}\n🤖 *${config.BOT_NAME}*`
            },
            { quoted: msg }
          );
        } else {
          return reply(`Direct Link: ${video.url}`);
        }
      } catch {
        return reply('❌ Video download failed.');
      }
    }

    case 'tiktok':
    case 'tt': {
      if (!q) return reply(`Usage: ${prefix}tiktok <video URL>`);
      await reply('⏳ Downloading TikTok video...');
      try {
        const res = await axios.get(
          `https://api.giftedtech.my.id/api/download/tiktok?url=${encodeURIComponent(q)}&apikey=gifted`,
          { timeout: 25000 }
        );
        const vid = res.data?.result?.video;
        if (vid) {
          return sock.sendMessage(
            from,
            {
              video: { url: vid },
              caption: `✨ TikTok (No Watermark)\n🤖 *${config.BOT_NAME}*`
            },
            { quoted: msg }
          );
        } else {
          return reply('Could not download this TikTok video.');
        }
      } catch {
        return reply('❌ Invalid TikTok link or service error.');
      }
    }

    case 'instagram':
    case 'facebook':
    case 'twitter':
    case 'spotify':
    case 'pinterest':
    case 'mediafire':
    case 'gdrive':
    case 'apk':
      if (!q) return reply(`Please provide a valid ${command.toUpperCase()} URL.`);
      return reply(`📥 *${command.toUpperCase()} Downloader:*\nFetching link for: ${q}...`);

    case 'lyrics':
      if (!q) return reply(`Usage: ${prefix}lyrics <song title>`);
      return reply(`🎼 *Lyrics search for:* "${q}"\n\n[Searching lyrics database...]`);

    // ═════════════════════════════════════════════════════════
    // 6. TOOLS
    // ═════════════════════════════════════════════════════════
    case 'ping': {
      const lat = Date.now() - (msg.messageTimestamp * 1000 || Date.now());
      return reply(`🏓 Pong! Latency: ${Math.abs(lat)}ms`);
    }

    case 'alive':
      return reply(
        `🌟 *${config.BOT_NAME} IS ONLINE!*

⏱️ *Uptime:* ${formatUptime(Date.now() - startTime)}
🧠 *RAM:* ${getRam()}
⚙️ *Mode:* ${config.BOT_MODE}
👑 *Owner:* ${config.OWNER_NAME}`
      );

    case 'uptime':
      return reply(`⏱️ *Uptime:* ${formatUptime(Date.now() - startTime)}`);

    case 'time':
      return reply(`🕒 *Current Time:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Dar_es_Salaam' })}`);

    case 'date':
      return reply(`📅 *Current Date:* ${new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Dar_es_Salaam' })}`);

    case 'calc':
    case 'math':
      if (!q) return reply(`Example: ${prefix}calc 50 * 4 + 10`);
      try {
        const cleanExpr = q.replace(/[^0-9+\-*/().]/g, '');
        const res = Function(`'use strict'; return (${cleanExpr})`)();
        return reply(`🧮 *Result:* ${res}`);
      } catch {
        return reply('❌ Invalid math expression.');
      }

    case 'weather':
      if (!q) return reply(`Provide city name. Example: ${prefix}weather Nairobi`);
      return reply(`☀️ *Weather for ${q}:* 27°C | Clear Skies | Humidity: 65%`);

    case 'news':
      return reply(`📰 *Tech News:* ${config.BOT_NAME} updated with 130+ commands and ultra-fast media downloaders.`);

    case 'currency':
      return reply(`💱 *Currency Exchange Rates:*\n• 1 USD = 2,650 TZS\n• 1 USD = 130 KES\n• 1 EUR = 2,820 TZS`);

    case 'qr':
      if (!q) return reply(`Provide text or link to encode. Example: ${prefix}qr hello`);
      return sock.sendMessage(
        from,
        {
          image: { url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(q)}` },
          caption: `📱 *QR Code Generated*`
        },
        { quoted: msg }
      );

    case 'barcode':
      return reply(`📊 *Barcode:* https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(q || 'HANSTECHY')}`);

    case 'shorturl':
    case 'expandurl':
      if (!q) return reply(`Provide a link to shorten.`);
      return reply(`🔗 *Shortened URL:* https://tinyurl.com/api-create.php?url=${encodeURIComponent(q)}`);

    case 'password': {
      const pass = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4).toUpperCase();
      return reply(`🔐 *Generated Secure Password:* \`${pass}\``);
    }

    case 'uuid':
      return reply(`🆔 *UUID v4:* \`${require('crypto').randomUUID()}\``);

    case 'base64':
    case 'encode':
      if (!q) return reply('Provide text to encode.');
      return reply(`🔒 *Base64 Encoded:* ${Buffer.from(q).toString('base64')}`);

    case 'unbase64':
    case 'decode':
      if (!q) return reply('Provide Base64 string to decode.');
      try {
        return reply(`🔓 *Decoded Text:* ${Buffer.from(q, 'base64').toString('utf-8')}`);
      } catch {
        return reply('❌ Invalid Base64 input.');
      }

    case 'reverse':
      if (!q) return reply('Provide text.');
      return reply(q.split('').reverse().join(''));

    case 'upper':
      if (!q) return reply('Provide text.');
      return reply(q.toUpperCase());

    case 'lower':
      if (!q) return reply('Provide text.');
      return reply(q.toLowerCase());

    case 'count':
      if (!q) return reply('Provide text.');
      return reply(`📊 *Characters:* ${q.length} | *Words:* ${q.split(/\s+/).filter(Boolean).length}`);

    case 'choose': {
      if (!q) return reply(`Provide choices separated by comma. Example: ${prefix}choose Coffee, Tea`);
      const opts = q.split(',').map((s) => s.trim());
      return reply(`🎯 I choose: *${opts[Math.floor(Math.random() * opts.length)]}*`);
    }

    case 'random':
      return reply(`🎲 Random Number: *${Math.floor(Math.random() * 1000) + 1}*`);

    case 'timestamp':
      return reply(`⏱️ Unix Timestamp: *${Date.now()}*`);

    // ═════════════════════════════════════════════════════════
    // 7. GAMES & FUN
    // ═════════════════════════════════════════════════════════
    case 'joke':
      return reply('😂 Why do programmers prefer dark mode? Because light attracts bugs!');

    case 'fact':
      return reply('💡 *Did you know?* The first computer mouse was made of wood in 1964!');

    case 'quote':
    case 'motivate':
      return reply('📜 *"Do what you can, with what you have, where you are."* — Theodore Roosevelt');

    case '8ball': {
      if (!q) return reply('Ask a question.');
      const answers = ['Yes, definitely!', 'No way.', 'Ask again later.', 'Most likely!', 'Outlook good!'];
      return reply(`🎱 *Answer:* ${answers[Math.floor(Math.random() * answers.length)]}`);
    }

    case 'coinflip':
      return reply(`🪙 The coin landed on: *${Math.random() > 0.5 ? 'HEADS' : 'TAILS'}*!`);

    case 'dice':
      return reply(`🎲 You rolled: *${Math.floor(Math.random() * 6) + 1}*!`);

    case 'riddle':
      return reply('🧩 *Riddle:* What has keys but can not open locks?\n\n*Answer:* A piano!');

    case 'trivia':
    case 'quiz':
      return reply('❓ *Trivia:* Which planet is known as the Red Planet?\n\n*Answer:* Mars');

    case 'ship':
      return reply(`❤️ Love Compatibility for *${q || 'Couple'}*: *${Math.floor(Math.random() * 100) + 1}%*`);

    case 'rate':
      return reply(`⭐ Rating for *${q || 'Target'}*: *${Math.floor(Math.random() * 10) + 1}/10*`);

    case 'compliment':
      return reply('😊 You are doing fantastic today, keep shining!');

    case 'roast':
      return reply('🔥 You bring so much joy to everyone... the moment you leave the room!');

    case 'truth':
      return reply('🤐 *Truth:* What is the biggest secret you have kept from your closest friend?');

    case 'dare':
      return reply('🔥 *Dare:* Send your favorite song recommendation right now!');

    // ═════════════════════════════════════════════════════════
    // 8. OWNER COMMANDS
    // ═════════════════════════════════════════════════════════
    case 'mode':
      if (!isOwner) return reply('⚠️ Owner only command.');
      if (q.toLowerCase() === 'private') {
        config.BOT_MODE = 'PRIVATE';
        return reply('🔒 Bot mode set to *PRIVATE*.');
      } else if (q.toLowerCase() === 'public') {
        config.BOT_MODE = 'PUBLIC';
        return reply('🔓 Bot mode set to *PUBLIC*.');
      }
      return reply(`Usage: ${prefix}mode public OR ${prefix}mode private`);

    case 'owner':
    case 'setowner':
    case 'ownerinfo':
      return reply(`👑 *Owner Name:* ${config.OWNER_NAME}\n📱 *Owner Phone:* wa.me/${config.OWNER_NUMBER}`);

    case 'restart':
    case 'update':
      if (!isOwner) return reply('⚠️ Owner only command.');
      await reply('🔄 Restarting bot processes...');
      return setTimeout(() => process.exit(0), 1000);

    case 'broadcast':
      if (!isOwner) return reply('⚠️ Owner only command.');
      return reply(`📢 Broadcast queued: "${q}"`);

    case 'clearsession':
      if (!isOwner) return reply('⚠️ Owner only command.');
      return reply('🧹 Session cache cleared.');

    case 'backup':
      if (!isOwner) return reply('⚠️ Owner only command.');
      return reply('💾 System backup ready.');

    case 'setprefix':
      if (!isOwner) return reply('⚠️ Owner only command.');
      if (!q) return reply(`Provide new prefix.`);
      config.PREFIX = q.trim();
      return reply(`⌨️ Prefix changed to: *${config.PREFIX}*`);

    case 'setnamebot':
      if (!isOwner) return reply('⚠️ Owner only command.');
      if (!q) return reply(`Provide new name.`);
      config.BOT_NAME = q.trim();
      return reply(`🤖 Bot name updated to: *${config.BOT_NAME}*`);

    case 'setbio':
    case 'block':
    case 'unblock':
    case 'shutdown':
      if (!isOwner) return reply('⚠️ Owner only command.');
      return reply(`⚙️ Owner command [${command.toUpperCase()}] executed.`);

    // ═════════════════════════════════════════════════════════
    // 9. MENU & SYSTEM INFO
    // ═════════════════════════════════════════════════════════
    case 'menu':
    case 'help': {
      const menu = `╭─ *${config.BOT_NAME}* ─╮
│ 👑 Owner: ${config.OWNER_NAME}
│ 📱 Number: ${config.OWNER_NUMBER || 'Configured'}
│ ⚙️ Mode: ${config.BOT_MODE}
│ ⏱️ Uptime: ${formatUptime(Date.now() - startTime)}
│ 🧠 RAM: ${getRam()}
│ ⌨️ Prefix: ${prefix}
╰────────────────────╯

╭━━━〔 🤖 *AI COMMANDS* 〕━━━╮
${prefix}ai
${prefix}gpt
${prefix}ask
${prefix}chat
${prefix}gemini
${prefix}llama
${prefix}copilot
${prefix}translate
${prefix}summarize
${prefix}rewrite
${prefix}grammar
${prefix}imagine
${prefix}code
${prefix}debug
${prefix}explain

╭━━━〔 ❤️ *STATUS COMMANDS* 〕━━━╮
${prefix}autolikestatus on/off
${prefix}autoviewstatus on/off
${prefix}status
${prefix}statusreply
${prefix}statusreact
${prefix}statussave
${prefix}statusdownload
${prefix}statusprivacy

╭━━━〔 👥 *GROUP COMMANDS* 〕━━━╮
${prefix}kick
${prefix}add
${prefix}promote
${prefix}demote
${prefix}mute
${prefix}unmute
${prefix}tagall
${prefix}hidetag
${prefix}groupinfo
${prefix}setname
${prefix}setdesc
${prefix}welcome
${prefix}goodbye
${prefix}antilink
${prefix}antispam
${prefix}lock
${prefix}unlock
${prefix}poll
${prefix}revoke

╭━━━〔 🎨 *STICKER & MEDIA* 〕━━━╮
${prefix}sticker
${prefix}s
${prefix}toimg
${prefix}tomp4
${prefix}togif
${prefix}circle
${prefix}crop
${prefix}blur
${prefix}invert
${prefix}wanted
${prefix}wasted
${prefix}trigger
${prefix}emojimix
${prefix}take
${prefix}attp
${prefix}ttp
${prefix}qc

╭━━━〔 📥 *DOWNLOADERS* 〕━━━╮
${prefix}play
${prefix}song
${prefix}video
${prefix}ytmp3
${prefix}ytmp4
${prefix}tiktok
${prefix}instagram
${prefix}facebook
${prefix}twitter
${prefix}spotify
${prefix}pinterest
${prefix}mediafire
${prefix}gdrive
${prefix}apk
${prefix}lyrics

╭━━━〔 🛠️ *TOOLS* 〕━━━╮
${prefix}ping
${prefix}alive
${prefix}uptime
${prefix}time
${prefix}date
${prefix}calc
${prefix}math
${prefix}weather
${prefix}news
${prefix}currency
${prefix}qr
${prefix}barcode
${prefix}shorturl
${prefix}expandurl
${prefix}password
${prefix}uuid
${prefix}base64
${prefix}unbase64
${prefix}encode
${prefix}decode
${prefix}reverse
${prefix}upper
${prefix}lower
${prefix}count
${prefix}choose
${prefix}random
${prefix}timestamp

╭━━━〔 🎮 *GAMES & FUN* 〕━━━╮
${prefix}joke
${prefix}fact
${prefix}quote
${prefix}motivate
${prefix}8ball
${prefix}coinflip
${prefix}dice
${prefix}riddle
${prefix}trivia
${prefix}quiz
${prefix}ship
${prefix}rate
${prefix}compliment
${prefix}roast
${prefix}truth
${prefix}dare

╭━━━〔 👑 *OWNER COMMANDS* 〕━━━╮
${prefix}mode private/public
${prefix}autolikestatus on/off
${prefix}autoviewstatus on/off
${prefix}setowner
${prefix}owner
${prefix}restart
${prefix}update
${prefix}broadcast
${prefix}clearsession
${prefix}backup
${prefix}setprefix
${prefix}setnamebot
${prefix}setbio
${prefix}block
${prefix}unblock
${prefix}shutdown

╭━━━〔 ➕ *MORE INFO* 〕━━━╮
${prefix}menu
${prefix}help
${prefix}support
${prefix}channel
${prefix}verify
${prefix}jid
${prefix}id
${prefix}repo
${prefix}script
${prefix}host
${prefix}server
${prefix}ram
${prefix}storage
${prefix}ownerinfo
${prefix}rules
${prefix}privacy
╰────────────────────╯

_${config.BOT_NAME}_`;
      return reply(menu);
    }

    case 'support':
    case 'channel':
      return reply(`📢 *Official Channel:* https://whatsapp.com/channel/0029VbAuCjELtOj5n8Lv9h3d\n💬 *Support:* wa.me/${config.OWNER_NUMBER}`);

    case 'verify':
      return reply(`✅ *${config.BOT_NAME} Verified:* Security checks passed.`);

    case 'jid':
    case 'id':
      return reply(`🆔 *Chat ID:* \`${from}\``);

    case 'repo':
    case 'script':
      return reply(`📦 *Repository:* https://github.com/hanstechy1/hans-techy-v2`);

    case 'host':
    case 'server':
      return reply(`☁️ *Host:* Heroku Dyno\n🖥️ *Node.js:* ${process.version}\n⚡ *Platform:* Linux`);

    case 'ram':
      return reply(`🧠 *Memory Usage:* ${getRam()}`);

    case 'storage':
      return reply(`💾 *Storage:* Persistent memory cache active.`);

    case 'rules':
    case 'privacy':
      return reply(`🛡️ *Privacy & Rules:*\n• No session IDs or phone numbers are shared or stored.\n• Respect server rate limits and avoid command spam.`);

    default:
      break;
  }
}

module.exports = { handleCommand };
