const config = require('./config');

async function handleCommand(sock, msg) {
  try {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? (msg.key.participant || from) : from;
    const senderNumber = sender.split('@')[0].split(':')[0];

    // Kupata maandishi ya ujumbe
    const body = msg.message?.conversation ||
                 msg.message?.extendedTextMessage?.text ||
                 msg.message?.imageMessage?.caption ||
                 '';

    if (!body || !body.startsWith(config.PREFIX)) return;

    const args = body.slice(config.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const isOwner = senderNumber.includes(config.OWNER_NUMBER.replace(/\D/g, '')) || msg.key.fromMe;

    // Kazi ya kujibu bila kunukuu ujumbe (inazuia tatizo la kutoonekana)
    const reply = async (text) => {
      return await sock.sendMessage(from, { text: String(text) });
    };

    switch (command) {
      case 'ping':
        await reply('Pong! 🚀 Bot iko hewani.');
        break;

      case 'alive':
        await reply(`🤖 *${config.BOT_NAME}* ipo macho na inafanya kazi vizuri!`);
        break;

      case 'menu':
      case 'help':
        await reply(
          `╭━━━〔 *${config.BOT_NAME}* 〕━━━╮\n` +
          `┃ Prefix: [ ${config.PREFIX} ]\n` +
          `┃ Hali: Online ✅\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
          `📌 *AMRI ZILIZOPO:*\n` +
          `🔹 *${config.PREFIX}ping* - Kupima kasi ya bot\n` +
          `🔹 *${config.PREFIX}alive* - Kuangalia kama bot ipo active\n` +
          `🔹 *${config.PREFIX}owner* - Mawasiliano ya mwenye bot\n` +
          `🔹 *${config.PREFIX}tagall* - Kutag wanachama (kwa group tu)\n` +
          `🔹 *${config.PREFIX}menu* - Orodha hii ya amri`
        );
        break;

      case 'owner':
        await reply(`📞 Mwenye bot: https://wa.me/${config.OWNER_NUMBER}`);
        break;

      case 'tagall':
        if (!isGroup) return await reply('Amri hii inafanya kazi kwenye magroup pekee!');
        const groupMeta = await sock.groupMetadata(from);
        const members = groupMeta.participants.map(p => p.id);
        let tagMsg = `📢 *WITO WA WANACHAMA:*\n\n`;
        for (let mem of members) {
          tagMsg += `@${mem.split('@')[0]}\n`;
        }
        await sock.sendMessage(from, { text: tagMsg, mentions: members });
        break;

      default:
        break;
    }
  } catch (err) {
    console.error('Kosa kwenye command handler:', err);
  }
}

module.exports = { handleCommand };
