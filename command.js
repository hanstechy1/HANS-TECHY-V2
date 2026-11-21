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
╰────────────────────╯

• ${config.PREFIX}ai <swali>
• ${config.PREFIX}ping
• ${config.PREFIX}alive
• ${config.PREFIX}sticker
• ${config.PREFIX}play <wimbo>
• ${config.PREFIX}menu
_Na nyingine 120+_`;
}

async function handleCommand({ sock, msg, from, sender, isOwner, reply, args, command, q, config }) {
  switch (command) {
    case 'ping': {
      const start = Date.now();
      await reply('Testing latency... ⚡');
      return reply(`🚀 *Pong:* ${Date.now() - start}ms`);
    }

    case 'alive': {
      const up = Math.floor(process.uptime());
      return reply(`🌟 *${config.BOT_NAME} IS ONLINE!*\n⏱️ *Uptime:* ${Math.floor(up / 60)} mins\n🧠 *RAM:* ${getRam()}`);
    }

    case 'ai':
    case 'gpt':
    case 'ask':
      if (!q) return reply(`Uliza swali! Mfano: ${config.PREFIX}${command} eleza maana ya AI`);
      try {
        const res = await axios.get(`https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=${encodeURI(q)}`, { timeout: 10000 });
        return reply(`🤖 *${config.BOT_NAME} AI:*\n\n${res.data?.result || res.data?.message || 'Jibu limepatikana.'}`);
      } catch {
        return reply(`🤖 *${config.BOT_NAME} AI:*\n\nNimepokea: "${q}".`);
      }

    case 'menu':
    case 'help':
      return reply(getMenu(config));

    default:
      break;
  }
}

module.exports = { handleCommand, getMenu, getRam };
