/**
 * HANS TECHY V2 - Message Event Handler
 * Coordinates commands, permissions, status monitoring, and anti-link.
 */

const { commands } = require('./command');
const { normalizeMessageContent } = require('@whiskeysockets/baileys');

/**
 * Normalize WhatsApp wrapper messages before reading their content.
 */
function unwrapMessage(message) {
  let current = message;

  for (let i = 0; i < 8 && current; i += 1) {
    const normalized = typeof normalizeMessageContent === 'function'
      ? normalizeMessageContent(current)
      : current;

    if (normalized && normalized !== current) {
      current = normalized;
      continue;
    }

    const wrapper =
      current.ephemeralMessage?.message ||
      current.viewOnceMessage?.message ||
      current.viewOnceMessageV2?.message ||
      current.viewOnceMessageV2Extension?.message ||
      current.documentWithCaptionMessage?.message ||
      current.editedMessage?.message ||
      current.deviceSentMessage?.message;

    if (!wrapper || wrapper === current) break;
    current = wrapper;
  }

  return current;
}

function getContextInfo(message) {
  if (!message || typeof message !== 'object') return null;

  for (const value of Object.values(message)) {
    if (value?.contextInfo) return value.contextInfo;
  }

  return null;
}

/**
 * Handle one incoming WhatsApp message or status update.
 */
async function handleSingleMessage(conn, upsert) {
  try {
    if (!upsert.messages || !upsert.messages[0]) return;

    const m = upsert.messages[0];
    m.message = unwrapMessage(m.message);

    const from = m.key?.remoteJid;
    if (!from) return;

    const prefix = process.env.PREFIX || '.';
    const botName = process.env.BOT_NAME || 'HANS TECHY V2';
    const ownerName = process.env.OWNER_NAME || 'HANS TECHY';
    const rawOwnerNumber = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
    const mode = (process.env.MODE || 'public').toLowerCase();
    const autoViewStatus = process.env.AUTO_VIEW_STATUS !== 'false';
    const autoLikeStatus = process.env.AUTO_LIKE_STATUS !== 'false';

    if (from === 'status@broadcast') {
      if (autoViewStatus) {
        await conn.readMessages([m.key]).catch(() => null);
      }

      if (autoLikeStatus && m.key.id) {
        const reactions = ['💚', '❤️', '🔥', '✨', '⚡', '💯', '👏', '😍'];
        const randomEmoji = reactions[Math.floor(Math.random() * reactions.length)];

        await conn.sendMessage(from, {
          react: { text: randomEmoji, key: m.key }
        }, {
          statusJidList: [m.key.participant]
        }).catch(() => null);
      }

      return;
    }

    if (!m.message) return;

    const body =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      m.message.videoMessage?.caption ||
      m.message.documentMessage?.caption ||
      m.message.buttonsResponseMessage?.selectedButtonId ||
      m.message.templateButtonReplyMessage?.selectedId ||
      m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
      m.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
      '';

    const contextInfo = getContextInfo(m.message);
    m.mentionedJid = contextInfo?.mentionedJid || [];
    m.quoted = contextInfo?.quotedMessage
      ? {
          ...contextInfo,
          sender: contextInfo.participant
        }
      : null;

    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? (m.key.participant || m.participant) : from;
    const senderNumber = sender ? sender.split('@')[0].replace(/[^0-9]/g, '') : '';
    const isOwner = Boolean(
      m.key.fromMe ||
      (rawOwnerNumber && senderNumber === rawOwnerNumber)
    );
    const pushName = m.pushName || 'User';

    m.from = from;
    m.sender = sender;
    m.isGroup = isGroup;

    let groupMetadata = null;
    let groupAdmins = [];
    let isAdmin = false;
    let isBotAdmin = false;

    if (isGroup) {
      try {
        groupMetadata = await conn.groupMetadata(from);
        const botJid = conn.user?.id
          ? `${conn.user.id.split(':')[0]}@s.whatsapp.net`
          : '';

        groupAdmins = groupMetadata.participants
          .filter((participant) =>
            participant.admin === 'admin' ||
            participant.admin === 'superadmin'
          )
          .map((participant) => participant.id);

        isAdmin = groupAdmins.includes(sender);
        isBotAdmin = groupAdmins.includes(botJid);
      } catch {
        // Continue without group metadata if lookup fails.
      }
    }

    if (isGroup && body.includes('chat.whatsapp.com/')) {
      if (!isAdmin && !isOwner) {
        await conn.sendMessage(from, {
          text: `⚠️ @${senderNumber}, sharing external group links is strictly prohibited!`,
          mentions: [sender]
        }, {
          quoted: m
        });

        if (isBotAdmin) {
          await conn.sendMessage(from, {
            delete: m.key
          }).catch(() => null);
        }
      }
    }

    const trimmedBody = String(body).trim();
    if (!trimmedBody.startsWith(prefix)) return;

    const args = trimmedBody
      .slice(prefix.length)
      .trim()
      .split(/\s+/);

    const cmdName = args.shift().toLowerCase();
    if (!cmdName) return;

    if (mode === 'private' && !isOwner) return;

    const cmd = commands.find((command) =>
      command.pattern === cmdName ||
      (command.alias && command.alias.includes(cmdName))
    );

    if (!cmd) return;

    if (cmd.onlyOwner && !isOwner) {
      return await conn.sendMessage(from, {
        text: '❌ This command is restricted to the bot Owner only!'
      }, {
        quoted: m
      });
    }

    if (cmd.onlyGroup && !isGroup) {
      return await conn.sendMessage(from, {
        text: '❌ This command can only be used in Groups!'
      }, {
        quoted: m
      });
    }

    if (cmd.onlyAdmin && !isAdmin && !isOwner) {
      return await conn.sendMessage(from, {
        text: '❌ You must be a Group Admin to use this command!'
      }, {
        quoted: m
      });
    }

    if (cmd.react) {
      await conn.sendMessage(from, {
        react: {
          text: cmd.react,
          key: m.key
        }
      }).catch(() => null);
    }

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
      const message = upsert.messages?.[0];

      if (message?.key?.remoteJid) {
        await conn.sendMessage(message.key.remoteJid, {
          text: '❌ Command failed. Please try again or contact the bot owner.'
        }, {
          quoted: message
        }).catch(() => null);
      }
    } catch {
      // Ignore secondary error.
    }
  }
}

async function handleMessage(conn, upsert) {
  for (const message of upsert.messages || []) {
    await handleSingleMessage(conn, {
      ...upsert,
      messages: [message]
    });
  }
}

module.exports = { handleMessage };
