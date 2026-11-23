const axios = require('axios');
const os = require('os');
const config = require('./config');

function getRam() {
  return `${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`;
}

function getMenu() {
  const up = Math.floor(process.uptime());
  const hours = Math.floor(up / 3600);
  const mins = Math.floor((up % 3600) / 60);

  return `╭─ *${config.BOT_NAME}* ─╮
│ 👑 *Owner:* ${config.OWNER_NAME}
│ 📱 *Number:* ${config.OWNER_NUMBER}
│ ⚙️ *Mode:* ${config.BOT_MODE}
│ ⚡ *Speed:* Ultra Fast
│ ⏱️ *Uptime:* ${hours}h ${mins}m
│ 🧠 *RAM:* ${getRam()}
╰────────────────────╯

🤖 *AI & SEARCH*
• ${config.PREFIX}ai <query>
• ${config.PREFIX}gpt <query>
• ${config.PREFIX}ask <query>

🛠️ *TOOLS & UTILITIES*
• ${config.PREFIX}ping
• ${config.PREFIX}alive
• ${config.PREFIX}calc <math>
• ${config.PREFIX}runtime
• ${config.PREFIX}owner

👥 *GROUP COMMANDS*
• ${config.PREFIX}tagall
• ${config.PREFIX}hidetag <text>
• ${config.PREFIX}groupinfo

🎮 *GAMES & FUN*
• ${config.PREFIX}joke
• ${config.PREFIX}fact
• ${config.PREFIX}8ball <question>
• ${config.PREFIX}roll
• ${config.PREFIX}flip

📜 *INFO*
• ${config.PREFIX}menu
• ${config.PREFIX}help
• ${config.PREFIX}rules
• ${config.PREFIX}privacy

_⚡ Powered by HANS TECHY Engine_`;
}

// Function inayopokea sawasawa na ilivyoitwa kutoka bot.js
async function handleCommand(sock, msg, reply, extra = {}) {
  try {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    
    // Namba ya mtumaji
    const sender = isGroup ? (msg.key.participant || from) : from;
    const cleanSender = sender.replace(/\D/g, '');
    const isOwner = cleanSender.includes(config.OWNER_NUMBER) || msg.key.fromMe;

    // Angalia kama BOT_MODE ni PRIVATE na mtumaji si mmiliki
    if (config.BOT_MODE === 'PRIVATE' && !isOwner) return;

    // Kusoma maandishi ya meseji kwa usahihi kutoka aina zote za ujumbe
    const msgType = Object.keys(msg.message || {})[0];
    const body = 
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      '';

    const text = body.trim();
    if (!text) return;

    // Angalia prefix
    const prefix = config.PREFIX || '.';
    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/\s+/);
    const command = (args.shift() || '').toLowerCase();
    const q = args.join(' ');

    switch (command) {
      // ===== CORE & STATUS =====
      case 'ping': {
        const start = Date.now();
        await reply('⚡ Testing speed...');
        return reply(`🚀 *Pong:* ${Date.now() - start}ms | *RAM:* ${getRam()}`);
      }

      case 'alive': {
        const up = Math.floor(process.uptime());
        return reply(
          `🌟 *${config.BOT_NAME} IS RUNNING!*\n\n` +
          `👑 *Owner:* ${config.OWNER_NAME}\n` +
          `⚙️ *Mode:* ${config.BOT_MODE}\n` +
          `⏱️ *Uptime:* ${Math.floor(up / 60)} minutes\n` +
          `🧠 *RAM:* ${getRam()}\n` +
          `✨ *Status:* Fully Operational ⚡`
        );
      }

      case 'menu':
      case 'help': {
        return reply(getMenu());
      }

      case 'runtime':
      case 'uptime': {
        const sec = Math.floor(process.uptime());
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return reply(`⏱️ *System Uptime:* ${h}h ${m}m ${s}s`);
      }

      case 'owner':
      case 'creator': {
        return reply(
          `👑 *BOT OWNER INFO:*\n\n` +
          `• *Name:* ${config.OWNER_NAME}\n` +
          `• *Number:* wa.me/${config.OWNER_NUMBER}\n` +
          `• *Bot:* ${config.BOT_NAME}`
        );
      }

      // ===== AI =====
      case 'ai':
      case 'gpt':
      case 'ask': {
        if (!q) return reply(`❓ Please provide a question.\n*Example:* ${prefix}${command} write a poem`);
        await reply('🤖 *Thinking...*');
        try {
          const res = await axios.get(`https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=${encodeURIComponent(q)}`, { timeout: 12000 });
          const answer = res.data?.result || res.data?.message;
          if (answer) return reply(`🤖 *${config.BOT_NAME} AI:*\n\n${answer}`);
        } catch {}
        return reply(`🤖 *${config.BOT_NAME} AI:*\n\nHere is what I found for "${q}".`);
      }

      // ===== UTILITIES =====
      case 'calc':
      case 'calculate': {
        if (!q) return reply(`Provide a math problem. Example: ${prefix}calc 25 * 4`);
        try {
          const sanitized = q.replace(/[^0-9+\-*/().\s]/g, '');
          const result = Function(`'use strict'; return (${sanitized})`)();
          return reply(`🔢 *Result:* ${result}`);
        } catch {
          return reply('❌ Invalid calculation.');
        }
      }

      // ===== GROUP COMMANDS =====
      case 'tagall': {
        if (!isGroup) return reply('❌ This command can only be used in groups.');
        try {
          const groupMeta = await sock.groupMetadata(from);
          const participants = groupMeta.participants || [];
          let tagMsg = `📢 *TAG ALL IN ${groupMeta.subject}*\n\n`;
          const mentions = [];
          for (const mem of participants) {
            tagMsg += `▪️ @${mem.id.split('@')[0]}\n`;
            mentions.push(mem.id);
          }
          return sock.sendMessage(from, { text: tagMsg, mentions }, { quoted: msg });
        } catch (e) {
          return reply('❌ Failed to fetch group members.');
        }
      }

      case 'hidetag': {
        if (!isGroup) return reply('❌ Group only command.');
        try {
          const groupMeta = await sock.groupMetadata(from);
          const mentions = (groupMeta.participants || []).map(p => p.id);
          return sock.sendMessage(from, { text: q || 'Attention everyone! ⚡', mentions });
        } catch {
          return reply('❌ Failed to broadcast.');
        }
      }

      case 'groupinfo': {
        if (!isGroup) return reply('❌ Group only command.');
        try {
          const meta = await sock.groupMetadata(from);
          return reply(
            `👥 *GROUP INFORMATION*\n\n` +
            `• *Name:* ${meta.subject}\n` +
            `• *Members:* ${meta.participants.length}\n` +
            `• *Created:* ${new Date(meta.creation * 1000).toLocaleDateString()}\n` +
            `• *Owner:* @${meta.owner ? meta.owner.split('@')[0] : 'Unknown'}`
          );
        } catch {
          return reply('❌ Could not fetch group info.');
        }
      }

      // ===== FUN & GAMES =====
      case 'joke': {
        const jokes = [
          "Why do programmers prefer dark mode? Because light attracts bugs!",
          "There are 10 types of people: those who understand binary, and those who don't.",
          "Why was the JavaScript developer sad? Because he didn't Node how to Express himself!"
        ];
        return reply(`😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`);
      }

      case 'fact': {
        const facts = [
          "The first computer bug was an actual real moth found in a computer in 1947.",
          "Over 3.8 billion people use WhatsApp globally.",
          "More than 500 hours of video are uploaded to YouTube every minute."
        ];
        return reply(`💡 *Fact:* ${facts[Math.floor(Math.random() * facts.length)]}`);
      }

      case '8ball': {
        if (!q) return reply(`Ask a question! Example: ${prefix}8ball will it rain today?`);
        const answers = ['Yes, definitely! ✅', 'Most likely 👍', 'Ask again later ⏳', 'Don’t count on it ❌', 'My sources say no 🚫'];
        return reply(`🎱 *Magic 8-Ball:* ${answers[Math.floor(Math.random() * answers.length)]}`);
      }

      case 'flip':
      case 'coin': {
        return reply(`🪙 *Coin Toss:* ${Math.random() > 0.5 ? 'HEADS 🦅' : 'TAILS 🪙'}`);
      }

      case 'roll':
      case 'dice': {
        return reply(`🎲 *Dice Roll:* ${Math.floor(Math.random() * 6) + 1}`);
      }

      case 'rules': {
        return reply('📜 *Rules:* No spamming commands, respect group members, use responsibly.');
      }

      case 'privacy': {
        return reply('🛡️ *Privacy:* End-to-end encryption maintained. Messages and personal data are never stored.');
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Kosa kwenye command:', err);
  }
}

module.exports = { handleCommand, getMenu, getRam };
