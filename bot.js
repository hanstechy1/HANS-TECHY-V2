/**
 * HANS TECHY V2 - Message Event Handler (English)
 * Coordinates commands, permissions, status monitoring, and anti-link
 */

const { commands } = require('./command');

/**
 * Handle incoming WhatsApp messages & status updates
 * @param {import('@whiskeysockets/baileys').WASocket} conn Baileys socket connection
 * @param {Object} upsert Upsert event payload
 */
async function handleSingleMessage(conn, upsert) {
  try {
    if (!upsert.messages || !upsert.messages[0]) return;
    const m = upsert.messages[0];

    // If message is ephemeral or viewOnce, unwrap inner message
    if (m.message?.ephemeralMessage) {
      m.message = m.message.ephemeralMessage.message;
    }
    if (m.message?.viewOnceMessageV2) {
      m.message = m.message.viewOnceMessageV2.message;
    }

    const from = m.key.remoteJid;
    if (!from) return;

    // Environment & Bot Config
    const prefix = process.env.PREFIX || '.';
    const botName = process.env.BOT_NAME || 'HANS TECHY V2';
    const ownerName = process.env.OWNER_NAME || 'HANS TECHY';
    const rawOwnerNumber = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
    const mode = (process.env.MODE || 'public').toLowerCase();
    const autoViewStatus = process.env.AUTO_VIEW_STATUS !== 'false';
    const autoLikeStatus = process.env.AUTO_LIKE_STATUS !== 'false';

    // 1. STATUS BROADCAST HANDLER
    if (from === 'status@broadcast') {
      if (autoViewStatus) {
        await conn.readMessages([m.key]).catch(() => null);
      }
      if (autoLikeStatus && m.key.id) {
        const reactions = ['💚', '❤️', '🔥', '✨', '⚡', '💯', '👏', '😍'];
        const randomEmoji = reactions[Math.floor(Math.random() * reactions.length)];
        await conn.sendMessage(from, {
          react: { text: randomEmoji, key: m.key }
        }, { statusJidList: [m.key.participant] }).catch(() => null);
      }
      return;
    }

    if (!m.message) return;

    // 2. EXTRACT MESSAGE CONTENT
    const body = m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      m.message.videoMessage?.caption ||
      m.message.buttonsResponseMessage?.selectedButtonId ||
      m.message.templateButtonReplyMessage?.selectedId ||
      '';

    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? (m.key.participant || m.participant) : from;
    const senderNumber = sender ? sender.split('@')[0].replace(/[^0-9]/g, '') : '';
    const isOwner = Boolean(m.key.fromMe || (rawOwnerNumber && senderNumber === rawOwnerNumber));
    const pushName = m.pushName || 'User';

    // Attach sender and from directly to m for easy access
    m.from = from;
    m.sender = sender;
    m.isGroup = isGroup;

    // Group Metadata & Admins
    let groupMetadata = null;
    let groupAdmins = [];
    let isAdmin = false;
    let isBotAdmin = false;

    if (isGroup) {
      try {
        groupMetadata = await conn.groupMetadata(from);
        const botJid = conn.user?.id ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : '';
        groupAdmins = groupMetadata.participants
          .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
          .map(p => p.id);
        isAdmin = groupAdmins.includes(sender);
        isBotAdmin = groupAdmins.includes(botJid);
      } catch {
        // Fallback if groupMetadata fails
      }
    }

    // 3. ANTI-LINK DETECTION (FOR GROUPS)
    if (isGroup && body.includes('chat.whatsapp.com/')) {
      if (!isAdmin && !isOwner) {
        await conn.sendMessage(from, {
          text: `⚠️ @${senderNumber}, sharing external group links is strictly prohibited!`,
          mentions: [sender]
        }, { quoted: m });

        if (isBotAdmin) {
          await conn.sendMessage(from, { delete: m.key }).catch(() => null);
        }
      }
    }

    // 4. CHECK PREFIX & COMMAND PARSING
    const trimmedBody = body.trim();
    if (!trimmedBody.startsWith(prefix)) return;

    const args = trimmedBody.slice(prefix.length).trim().split(/\s+/);
    const cmdName = args.shift().toLowerCase();
    if (!cmdName) return;

    // 5. MODE RESTRICTION
    if (mode === 'private' && !isOwner) {
      return;
    }

    // 6. FIND MATCHING COMMAND
    const cmd = commands.find(c => c.pattern === cmdName || (c.alias && c.alias.includes(cmdName)));
    if (!cmd) return;

    // 7. PERMISSION VALIDATIONS
    if (cmd.onlyOwner && !isOwner) {
      return await conn.sendMessage(from, { text: '❌ This command is restricted to the bot Owner only!' }, { quoted: m });
    }

    if (cmd.onlyGroup && !isGroup) {
      return await conn.sendMessage(from, { text: '❌ This command can only be used in Groups!' }, { quoted: m });
    }

    if (cmd.onlyAdmin && !isAdmin && !isOwner) {
      return await conn.sendMessage(from, { text: '❌ You must be a Group Admin to use this command!' }, { quoted: m });
    }

    // Reaction if command defines one
    if (cmd.react) {
      await conn.sendMessage(from, { react: { text: cmd.react, key: m.key } }).catch(() => null);
    }

    // 8. EXECUTE COMMAND
    await cmd.function(conn, m, {
      args,
      prefix,
      botName,
      ownerName,
      ownerNumber: rawOwnerNumber,
      mode,
      isGroup,
      isAdmin,
      isBotAdmin,
      isOwner,
      pushName,
      groupMetadata
    });

  } catch (err) {
    console.error('Error in handleMessage:', err);
    try {
      if (upsert.messages?.[0]?.key?.remoteJid) {
        await conn.sendMessage(upsert.messages[0].key.remoteJid, {
          text: '❌ Command failed. Please try again or contact the bot owner.'
        }, { quoted: upsert.messages[0] }).catch(() => null);
      }
    } catch {
      // Ignore secondary error
    }
  }
}

async function handleMessage(conn, upsert) {
  // Baileys may deliver several messages in one upsert; process each independently.
  for (const message of upsert.messages || []) {
    await handleSingleMessage(conn, { ...upsert, messages: [message] });
  }
}

module.exports = { handleMessage };
