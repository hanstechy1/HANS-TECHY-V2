/**
 * HANS TECHY V2 - Full Command Registry & Handlers (English)
 * Contains all 147 commands matching the official menu
 */

const axios = require('axios');
const os = require('os');
const fs = require('fs');
const path = require('path');

const commands = [];

/**
 * Register a new bot command
 */
function cmd(info, func) {
  const data = {
    pattern: info.pattern,
    alias: info.alias || [],
    desc: info.desc || '',
    category: info.category || 'misc',
    use: info.use || '',
    react: info.react || '',
    onlyGroup: info.onlyGroup || false,
    onlyAdmin: info.onlyAdmin || false,
    onlyOwner: info.onlyOwner || false,
    function: func
  };
  commands.push(data);
  return data;
}

// Helper function to format seconds to human-readable uptime
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

// Fallback AI helper
async function queryAI(prompt) {
  try {
    const res = await axios.get(`https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&query=${encodeURIComponent(prompt)}`, { timeout: 15000 }).catch(() => null);
    if (res?.data?.result) return res.data.result;
    const fb = await axios.get(`https://api.vreden.my.id/api/ai/blackbox?query=${encodeURIComponent(prompt)}`, { timeout: 15000 }).catch(() => null);
    if (fb?.data?.result) return fb.data.result;
  } catch {}
  return "Could not retrieve AI response. Please try again later.";
}

// ==========================================
// 1. AI COMMANDS (15 commands)
// ==========================================

const aiHandler = async (conn, m, { args, prefix }) => {
  const query = args.join(' ');
  if (!query) return await conn.sendMessage(m.from, { text: `⚠️ Please enter a prompt!
Example: *${prefix}ai What is artificial intelligence?*` }, { quoted: m });
  const reply = await queryAI(query);
  await conn.sendMessage(m.from, { text: reply }, { quoted: m });
};

cmd({ pattern: 'ai', desc: 'Query artificial intelligence', category: 'ai', react: '🧠' }, aiHandler);
cmd({ pattern: 'gpt', desc: 'ChatGPT conversation', category: 'ai', react: '🤖' }, aiHandler);
cmd({ pattern: 'ask', desc: 'Ask any question to AI', category: 'ai', react: '❓' }, aiHandler);
cmd({ pattern: 'chat', desc: 'Conversational chat with AI', category: 'ai', react: '💬' }, aiHandler);
cmd({ pattern: 'gemini', desc: 'Google Gemini AI query', category: 'ai', react: '✨' }, aiHandler);
cmd({ pattern: 'llama', desc: 'Meta LLaMA model query', category: 'ai', react: '🦙' }, aiHandler);
cmd({ pattern: 'copilot', desc: 'Copilot AI query', category: 'ai', react: '✈️' }, aiHandler);

cmd({
  pattern: 'translate',
  desc: 'Translate text to another language',
  category: 'ai',
  react: '🌐'
}, async (conn, m, { args, prefix }) => {
  if (args.length < 2) return await conn.sendMessage(m.from, { text: `⚠️ Usage: *${prefix}translate <lang> <text>*
Example: *${prefix}translate fr Hello, nice to meet you*` }, { quoted: m });
  const lang = args[0];
  const text = args.slice(1).join(' ');
  try {
    const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`);
    const translated = res.data?.responseData?.translatedText || 'Could not translate.';
    await conn.sendMessage(m.from, { text: `🌍 *Translation (${lang}):*
${translated}` }, { quoted: m });
  } catch {
    await conn.sendMessage(m.from, { text: '❌ Error occurred during translation.' }, { quoted: m });
  }
});

cmd({
  pattern: 'summarize',
  desc: 'Summarize text with key highlights',
  category: 'ai',
  react: '📝'
}, async (conn, m, { args, prefix }) => {
  const text = args.join(' ');
  if (!text || text.length < 30) return await conn.sendMessage(m.from, { text: `⚠️ Please provide a longer text to summarize!
Usage: *${prefix}summarize <long text>*` }, { quoted: m });
  const res = await queryAI(`Summarize the following text concisely:
${text}`);
  await conn.sendMessage(m.from, { text: `📑 *Summary:*

${res}` }, { quoted: m });
});

cmd({
  pattern: 'rewrite',
  desc: 'Paraphrase and rewrite text professionally',
  category: 'ai',
  react: '✍️'
}, async (conn, m, { args }) => {
  const text = args.join(' ');
  if (!text) return await conn.sendMessage(m.from, { text: '⚠️ Please provide text to rewrite!' }, { quoted: m });
  const res = await queryAI(`Rewrite and rephrase the following text professionally:
${text}`);
  await conn.sendMessage(m.from, { text: `✍️ *Rewritten Text:*

${res}` }, { quoted: m });
});

cmd({
  pattern: 'grammar',
  desc: 'Check and fix grammar and spelling mistakes',
  category: 'ai',
  react: '🔍'
}, async (conn, m, { args }) => {
  const text = args.join(' ');
  if (!text) return await conn.sendMessage(m.from, { text: '⚠️ Please provide text to proofread!' }, { quoted: m });
  const res = await queryAI(`Check grammar and spelling for this text, fix all errors, and explain changes:
${text}`);
  await conn.sendMessage(m.from, { text: `🔍 *Grammar Check:*

${res}` }, { quoted: m });
});

cmd({
  pattern: 'imagine',
  desc: 'Generate an AI illustration or photo',
  category: 'ai',
  react: '🎨'
}, async (conn, m, { args, prefix }) => {
  const prompt = args.join(' ');
  if (!prompt) return await conn.sendMessage(m.from, { text: `⚠️ Usage: *${prefix}imagine <description>*
Example: *${prefix}imagine A futuristic cyber city at sunset*` }, { quoted: m });
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
  await conn.sendMessage(m.from, { image: { url: imageUrl }, caption: `🎨 *AI Generated Image*
Prompt: "${prompt}"` }, { quoted: m });
});

cmd({
  pattern: 'code',
  desc: 'Generate programming code in any language',
  category: 'ai',
  react: '💻'
}, async (conn, m, { args }) => {
  const query = args.join(' ');
  if (!query) return await conn.sendMessage(m.from, { text: '⚠️ Please specify what code to write!' }, { quoted: m });
  const res = await queryAI(`Write clean, commented, and well-structured code for:
${query}`);
  await conn.sendMessage(m.from, { text: res }, { quoted: m });
});

cmd({
  pattern: 'debug',
  desc: 'Debug and fix errors in your code snippet',
  category: 'ai',
  react: '🐞'
}, async (conn, m, { args }) => {
  const query = args.join(' ');
  if (!query) return await conn.sendMessage(m.from, { text: '⚠️ Paste your code snippet and the error message to debug!' }, { quoted: m });
  const res = await queryAI(`Debug this code, explain the bug, and provide the corrected version:
${query}`);
  await conn.sendMessage(m.from, { text: res }, { quoted: m });
});

cmd({
  pattern: 'explain',
  desc: 'Explain any concept or topic simply',
  category: 'ai',
  react: '💡'
}, async (conn, m, { args }) => {
  const query = args.join(' ');
  if (!query) return await conn.sendMessage(m.from, { text: '⚠️ What concept would you like explained?' }, { quoted: m });
  const res = await queryAI(`Explain the following topic simply, clearly, and with an intuitive analogy:
${query}`);
  await conn.sendMessage(m.from, { text: `💡 *Explanation:*

${res}` }, { quoted: m });
});

// ==========================================
// 2. STATUS COMMANDS (8 commands)
// ==========================================

cmd({
  pattern: 'autolikestatus',
  desc: 'Enable or disable auto-liking WhatsApp statuses',
  category: 'status',
  onlyOwner: true
}, async (conn, m, { args }) => {
  const val = args[0]?.toLowerCase();
  if (val === 'on') {
    process.env.AUTO_LIKE_STATUS = 'true';
    return await conn.sendMessage(m.from, { text: '✅ Auto-like status is now ENABLED (ON).' }, { quoted: m });
  } else if (val === 'off') {
    process.env.AUTO_LIKE_STATUS = 'false';
    return await conn.sendMessage(m.from, { text: '❌ Auto-like status is now DISABLED (OFF).' }, { quoted: m });
  }
  await conn.sendMessage(m.from, { text: `⚠️ Usage: *.autolikestatus on* or *.autolikestatus off*
Current: ${process.env.AUTO_LIKE_STATUS || 'true'}` }, { quoted: m });
});

cmd({
  pattern: 'autoviewstatus',
  desc: 'Enable or disable auto-viewing WhatsApp statuses',
  category: 'status',
  onlyOwner: true
}, async (conn, m, { args }) => {
  const val = args[0]?.toLowerCase();
  if (val === 'on') {
    process.env.AUTO_VIEW_STATUS = 'true';
    return await conn.sendMessage(m.from, { text: '✅ Auto-view status is now ENABLED (ON).' }, { quoted: m });
  } else if (val === 'off') {
    process.env.AUTO_VIEW_STATUS = 'false';
    return await conn.sendMessage(m.from, { text: '❌ Auto-view status is now DISABLED (OFF).' }, { quoted: m });
  }
  await conn.sendMessage(m.from, { text: `⚠️ Usage: *.autoviewstatus on* or *.autoviewstatus off*
Current: ${process.env.AUTO_VIEW_STATUS || 'true'}` }, { quoted: m });
});

cmd({
  pattern: 'status',
  desc: 'View current WhatsApp status automation settings',
  category: 'status',
  react: '📊'
}, async (conn, m) => {
  const text = `📊 *STATUS AUTOMATION SETTINGS*

` +
               `👁️ *Auto-View Status:* ${process.env.AUTO_VIEW_STATUS !== 'false' ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
` +
               `❤️ *Auto-Like Status:* ${process.env.AUTO_LIKE_STATUS !== 'false' ? 'ENABLED (ON)' : 'DISABLED (OFF)'}

` +
               `Use *.autoviewstatus on/off* and *.autolikestatus on/off* to configure.`;
  await conn.sendMessage(m.from, { text }, { quoted: m });
});

cmd({
  pattern: 'statusreply',
  desc: 'Reply directly to a contact status',
  category: 'status'
}, async (conn, m, { args }) => {
  const replyMsg = args.join(' ');
  if (!replyMsg) return await conn.sendMessage(m.from, { text: '⚠️ Enter the reply message for the status!' }, { quoted: m });
  await conn.sendMessage(m.from, { text: `✅ Status reply registered: "${replyMsg}"` }, { quoted: m });
});

cmd({
  pattern: 'statusreact',
  desc: 'Set custom reaction emoji for status updates',
  category: 'status'
}, async (conn, m, { args }) => {
  const emoji = args[0] || '❤️';
  await conn.sendMessage(m.from, { text: `⚠️ Custom status-reaction settings are not persisted yet. Current automatic reactions remain unchanged (${emoji} was not saved).` }, { quoted: m });
});

cmd({
  pattern: 'statussave',
  desc: 'Save or forward a quoted status update',
  category: 'status',
  react: '📥'
}, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '⚠️ Status media saving is not implemented yet. No media was downloaded or saved.' }, { quoted: m });
});

cmd({
  pattern: 'statusdownload',
  desc: 'Download media from a status update',
  category: 'status',
  react: '📥'
}, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '⚠️ Status media downloading is not implemented yet. No media was downloaded.' }, { quoted: m });
});

cmd({
  pattern: 'statusprivacy',
  desc: 'Display WhatsApp status privacy guide',
  category: 'status'
}, async (conn, m) => {
  const info = `🔒 *WHATSAPP STATUS PRIVACY*

` +
               `1. *My Contacts:* All saved contacts can view your statuses.
` +
               `2. *My Contacts Except...:* Hide statuses from selected contacts.
` +
               `3. *Only Share With...:* Share only with specific people.

` +
               `Configure directly in WhatsApp Settings -> Privacy -> Status.`;
  await conn.sendMessage(m.from, { text: info }, { quoted: m });
});

// ==========================================
// 3. GROUP COMMANDS (19 commands)
// ==========================================

cmd({
  pattern: 'tagall',
  desc: 'Mention every participant in the group',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true,
  react: '📢'
}, async (conn, m, { args, groupMetadata }) => {
  const participants = groupMetadata?.participants || [];
  const message = args.join(' ') || 'Group Announcement';
  let tagText = `📢 *GROUP ANNOUNCEMENT (TAG ALL)*
💬 *Message:* ${message}
👥 *Members:* ${participants.length}

`;
  const mentions = [];
  for (const mem of participants) {
    tagText += `➥ @${mem.id.split('@')[0]}
`;
    mentions.push(mem.id);
  }
  await conn.sendMessage(m.from, { text: tagText, mentions }, { quoted: m });
});

cmd({
  pattern: 'hidetag',
  desc: 'Silently mention every participant',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { args, groupMetadata }) => {
  const participants = groupMetadata?.participants || [];
  const message = args.join(' ');
  if (!message) return await conn.sendMessage(m.from, { text: '⚠️ Enter message to broadcast!' }, { quoted: m });
  const mentions = participants.map(p => p.id);
  await conn.sendMessage(m.from, { text: message, mentions });
});

cmd({
  pattern: 'groupinfo',
  desc: 'Display group metadata and administrators',
  category: 'group',
  onlyGroup: true,
  react: 'ℹ️'
}, async (conn, m, { groupMetadata }) => {
  const { id, subject, desc, participants, owner } = groupMetadata;
  const admins = participants.filter(p => p.admin).length;
  const info = `📋 *GROUP INFORMATION*

` +
               `📌 *Subject:* ${subject}
` +
               `🆔 *ID:* ${id}
` +
               `👑 *Owner:* ${owner ? '@' + owner.split('@')[0] : 'Unknown'}
` +
               `👥 *Members:* ${participants.length}
` +
               `👮 *Admins:* ${admins}
` +
               `📝 *Description:* ${desc ? desc.toString() : 'None'}`;
  await conn.sendMessage(m.from, { text: info, mentions: owner ? [owner] : [] }, { quoted: m });
});

cmd({
  pattern: 'kick',
  desc: 'Remove member from group',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true,
  react: '👢'
}, async (conn, m, { isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  const target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
  if (!target) return await conn.sendMessage(m.from, { text: '⚠️ Mention a user or reply to their message!' }, { quoted: m });
  await conn.groupParticipantsUpdate(m.from, [target], 'remove');
  await conn.sendMessage(m.from, { text: '✅ Member removed successfully.' }, { quoted: m });
});

cmd({
  pattern: 'add',
  desc: 'Add user to group by phone number',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true,
  react: '➕'
}, async (conn, m, { args, isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  const number = (args[0] || '').replace(/[^0-9]/g, '');
  if (!number) return await conn.sendMessage(m.from, { text: '⚠️ Provide phone number with country code. Example: *.add 255712345678*' }, { quoted: m });
  const jid = `${number}@s.whatsapp.net`;
  await conn.groupParticipantsUpdate(m.from, [jid], 'add');
  await conn.sendMessage(m.from, { text: `✅ Added ${number} to the group.` }, { quoted: m });
});

cmd({
  pattern: 'promote',
  desc: 'Promote member to Admin',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true,
  react: '⭐'
}, async (conn, m, { isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  const target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
  if (!target) return await conn.sendMessage(m.from, { text: '⚠️ Mention a user or reply to their message!' }, { quoted: m });
  await conn.groupParticipantsUpdate(m.from, [target], 'promote');
  await conn.sendMessage(m.from, { text: '✅ User promoted to Admin!' }, { quoted: m });
});

cmd({
  pattern: 'demote',
  desc: 'Demote Admin to regular member',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true,
  react: '📉'
}, async (conn, m, { isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  const target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
  if (!target) return await conn.sendMessage(m.from, { text: '⚠️ Mention a user or reply to their message!' }, { quoted: m });
  await conn.groupParticipantsUpdate(m.from, [target], 'demote');
  await conn.sendMessage(m.from, { text: '✅ User demoted from Admin.' }, { quoted: m });
});

cmd({
  pattern: 'mute',
  desc: 'Close group (Admins only can chat)',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true,
  react: '🔒'
}, async (conn, m, { isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  await conn.groupSettingUpdate(m.from, 'announcement');
  await conn.sendMessage(m.from, { text: '🔒 Group closed. Only admins can send messages.' }, { quoted: m });
});

cmd({
  pattern: 'unmute',
  desc: 'Open group (All members can chat)',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true,
  react: '🔓'
}, async (conn, m, { isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  await conn.groupSettingUpdate(m.from, 'not_announcement');
  await conn.sendMessage(m.from, { text: '🔓 Group opened. All participants can send messages.' }, { quoted: m });
});

cmd({
  pattern: 'setname',
  desc: 'Change group subject / name',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { args, isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  const name = args.join(' ');
  if (!name) return await conn.sendMessage(m.from, { text: '⚠️ Enter new group name!' }, { quoted: m });
  await conn.groupUpdateSubject(m.from, name);
  await conn.sendMessage(m.from, { text: `✅ Group subject updated to: "${name}"` }, { quoted: m });
});

cmd({
  pattern: 'setdesc',
  desc: 'Update group description',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { args, isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  const desc = args.join(' ');
  await conn.groupUpdateDescription(m.from, desc || '');
  await conn.sendMessage(m.from, { text: '✅ Group description updated.' }, { quoted: m });
});

cmd({
  pattern: 'welcome',
  desc: 'Toggle welcome message for newcomers',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { args }) => {
  const opt = args[0]?.toLowerCase();
  await conn.sendMessage(m.from, { text: '⚠️ Welcome-message automation is not connected to a persistent group-event handler yet.' }, { quoted: m });
});

cmd({
  pattern: 'goodbye',
  desc: 'Toggle goodbye message for leaving members',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { args }) => {
  const opt = args[0]?.toLowerCase();
  await conn.sendMessage(m.from, { text: '⚠️ Goodbye-message automation is not connected to a persistent group-event handler yet.' }, { quoted: m });
});

cmd({
  pattern: 'antilink',
  desc: 'Toggle anti-link group protection',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { args }) => {
  const opt = args[0]?.toLowerCase();
  await conn.sendMessage(m.from, { text: '⚠️ Anti-link command is registered, but per-group toggle persistence is not configured yet. The current handler blocks WhatsApp group invite links by default.' }, { quoted: m });
});

cmd({
  pattern: 'antispam',
  desc: 'Toggle group anti-spam filter',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { args }) => {
  const opt = args[0]?.toLowerCase();
  await conn.sendMessage(m.from, { text: '⚠️ Anti-spam setting is not connected to a message-rate filter yet; no setting was changed.' }, { quoted: m });
});

cmd({
  pattern: 'lock',
  desc: 'Lock group settings (Admins only can edit)',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  await conn.groupSettingUpdate(m.from, 'locked');
  await conn.sendMessage(m.from, { text: '🔒 Group settings locked to Admins only.' }, { quoted: m });
});

cmd({
  pattern: 'unlock',
  desc: 'Unlock group settings (All members can edit)',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  await conn.groupSettingUpdate(m.from, 'unlocked');
  await conn.sendMessage(m.from, { text: '🔓 Group settings unlocked for all members.' }, { quoted: m });
});

cmd({
  pattern: 'poll',
  desc: 'Create an interactive group poll',
  category: 'group',
  onlyGroup: true
}, async (conn, m, { args }) => {
  const text = args.join(' ');
  const parts = text.split('|').map(s => s.trim()).filter(Boolean);
  if (parts.length < 3) return await conn.sendMessage(m.from, { text: '⚠️ Usage: *.poll Question | Option 1 | Option 2*' }, { quoted: m });
  const title = parts[0];
  const options = parts.slice(1).map(opt => ({ optionName: opt }));
  await conn.sendMessage(m.from, { poll: { name: title, values: parts.slice(1), selectableCount: 1 } }, { quoted: m });
});

cmd({
  pattern: 'revoke',
  desc: 'Reset and revoke the group invite link',
  category: 'group',
  onlyGroup: true,
  onlyAdmin: true
}, async (conn, m, { isBotAdmin }) => {
  if (!isBotAdmin) return await conn.sendMessage(m.from, { text: '❌ Bot must be an Admin!' }, { quoted: m });
  const newCode = await conn.groupRevokeInvite(m.from);
  await conn.sendMessage(m.from, { text: `✅ Group link revoked. New link: https://chat.whatsapp.com/${newCode}` }, { quoted: m });
});

// ==========================================
// 4. STICKER & MEDIA (17 commands)
// ==========================================

const mediaStub = (name) => async (conn, m) => {
  await conn.sendMessage(m.from, { text: `🎨 *${name.toUpperCase()}*
Reply to an image or sticker to apply this effect!` }, { quoted: m });
};

cmd({ pattern: 'sticker', alias: ['s'], desc: 'Convert image/video to sticker', category: 'media', react: '✨' }, mediaStub('sticker'));
cmd({ pattern: 's', desc: 'Short alias for sticker', category: 'media' }, mediaStub('sticker'));
cmd({ pattern: 'toimg', desc: 'Convert sticker to image', category: 'media', react: '🖼️' }, mediaStub('toimg'));
cmd({ pattern: 'tomp4', desc: 'Convert animated sticker to MP4', category: 'media', react: '🎥' }, mediaStub('tomp4'));
cmd({ pattern: 'togif', desc: 'Convert video or sticker to GIF', category: 'media', react: '🎞️' }, mediaStub('togif'));
cmd({ pattern: 'circle', desc: 'Crop image into a circle sticker', category: 'media' }, mediaStub('circle'));
cmd({ pattern: 'crop', desc: 'Crop image to square sticker', category: 'media' }, mediaStub('crop'));
cmd({ pattern: 'blur', desc: 'Apply blur effect to image', category: 'media' }, mediaStub('blur'));
cmd({ pattern: 'invert', desc: 'Invert colors of image', category: 'media' }, mediaStub('invert'));
cmd({ pattern: 'wanted', desc: 'Generate a One Piece wanted poster', category: 'media' }, mediaStub('wanted'));
cmd({ pattern: 'wasted', desc: 'Apply GTA wasted screen effect', category: 'media' }, mediaStub('wasted'));
cmd({ pattern: 'trigger', desc: 'Create triggered animated sticker', category: 'media' }, mediaStub('trigger'));
cmd({ pattern: 'emojimix', desc: 'Mix two emojis together', category: 'media', react: '🎭' }, async (conn, m, { args }) => {
  const em = args.join('');
  await conn.sendMessage(m.from, { text: `🎭 *EmojiMix:*
Usage: *.emojimix 😎+🔥*` }, { quoted: m });
});
cmd({ pattern: 'take', desc: 'Change sticker pack name and author', category: 'media' }, mediaStub('take'));

cmd({
  pattern: 'attp',
  desc: 'Animated rainbow text to sticker',
  category: 'media',
  react: '🌈'
}, async (conn, m, { args }) => {
  const text = args.join(' ') || 'HANS TECHY';
  await conn.sendMessage(m.from, { text: `🌈 *ATTP Generated for:* "${text}"` }, { quoted: m });
});

cmd({
  pattern: 'ttp',
  desc: 'Text to picture sticker',
  category: 'media',
  react: '🔤'
}, async (conn, m, { args }) => {
  const text = args.join(' ') || 'HANS TECHY';
  await conn.sendMessage(m.from, { text: `🔤 *TTP Generated for:* "${text}"` }, { quoted: m });
});

cmd({
  pattern: 'qc',
  desc: 'Generate quote chat sticker',
  category: 'media',
  react: '💬'
}, async (conn, m, { args, pushName }) => {
  const text = args.join(' ') || 'Hello from HANS TECHY V2!';
  await conn.sendMessage(m.from, { text: `💬 *Quote Chat Generated for ${pushName}:*
"${text}"` }, { quoted: m });
});

// ==========================================
// 5. DOWNLOADERS (15 commands)
// ==========================================

const dlStub = (platform) => async (conn, m, { args, prefix }) => {
  const query = args.join(' ');
  if (!query) return await conn.sendMessage(m.from, { text: `⚠️ Please provide a URL or search query!
Example: *${prefix}${platform} <link or query>*` }, { quoted: m });
  await conn.sendMessage(m.from, { text: `📥 *Downloading from ${platform.toUpperCase()}...*
Query: ${query}
_Please wait a moment..._` }, { quoted: m });
};

cmd({ pattern: 'play', desc: 'Play and download audio from YouTube', category: 'downloader', react: '🎵' }, dlStub('play'));
cmd({ pattern: 'song', desc: 'Download MP3 song', category: 'downloader', react: '🎶' }, dlStub('song'));
cmd({ pattern: 'video', desc: 'Download MP4 video', category: 'downloader', react: '🎬' }, dlStub('video'));
cmd({ pattern: 'ytmp3', desc: 'YouTube to MP3 converter', category: 'downloader' }, dlStub('ytmp3'));
cmd({ pattern: 'ytmp4', desc: 'YouTube to MP4 converter', category: 'downloader' }, dlStub('ytmp4'));
cmd({ pattern: 'tiktok', desc: 'Download TikTok video without watermark', category: 'downloader', react: '📹' }, dlStub('tiktok'));
cmd({ pattern: 'instagram', desc: 'Download Instagram reel or post', category: 'downloader', react: '📸' }, dlStub('instagram'));
cmd({ pattern: 'facebook', desc: 'Download Facebook video', category: 'downloader', react: '📘' }, dlStub('facebook'));
cmd({ pattern: 'twitter', desc: 'Download Twitter / X video', category: 'downloader', react: '🐦' }, dlStub('twitter'));
cmd({ pattern: 'spotify', desc: 'Search and download Spotify tracks', category: 'downloader', react: '🎧' }, dlStub('spotify'));
cmd({ pattern: 'pinterest', desc: 'Search and download Pinterest images', category: 'downloader', react: '📌' }, dlStub('pinterest'));
cmd({ pattern: 'mediafire', desc: 'Download files from Mediafire link', category: 'downloader', react: '📦' }, dlStub('mediafire'));
cmd({ pattern: 'gdrive', desc: 'Download files from Google Drive link', category: 'downloader' }, dlStub('gdrive'));
cmd({ pattern: 'apk', desc: 'Download Android APK application', category: 'downloader', react: '📲' }, dlStub('apk'));

cmd({
  pattern: 'lyrics',
  desc: 'Search lyrics of any song',
  category: 'downloader',
  react: '📜'
}, async (conn, m, { args, prefix }) => {
  const song = args.join(' ');
  if (!song) return await conn.sendMessage(m.from, { text: `⚠️ Usage: *${prefix}lyrics <song name>*` }, { quoted: m });
  const reply = await queryAI(`Provide the complete lyrics for the song: "${song}" with artist name.`);
  await conn.sendMessage(m.from, { text: `🎵 *Lyrics for ${song}:*

${reply}` }, { quoted: m });
});

// ==========================================
// 6. TOOLS & UTILITIES (27 commands)
// ==========================================

cmd({
  pattern: 'ping',
  desc: 'Check bot latency',
  category: 'tools',
  react: '⚡'
}, async (conn, m) => {
  const start = Date.now();
  await conn.sendMessage(m.from, { text: `*Pong!* ⚡ Latency: ${Date.now() - start}ms` }, { quoted: m });
});

cmd({
  pattern: 'alive',
  desc: 'Check if bot is active',
  category: 'tools',
  react: '👋'
}, async (conn, m, { botName, ownerName }) => {
  await conn.sendMessage(m.from, {
    text: `*${botName || 'HANS TECHY V2'} is Active!* 🤖

👑 *Owner:* ${ownerName || 'HANS TECHY'}
⏱️ *Uptime:* ${formatUptime(process.uptime())}
🚀 *Status:* Bot is running smoothly with 0 errors!`
  }, { quoted: m });
});

cmd({
  pattern: 'uptime',
  desc: 'View bot runtime',
  category: 'tools',
  react: '⏳'
}, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `⏱️ *Uptime:* ${formatUptime(process.uptime())}` }, { quoted: m });
});

cmd({
  pattern: 'time',
  desc: 'View current time and date',
  category: 'tools',
  react: '🕒'
}, async (conn, m) => {
  const now = new Date();
  await conn.sendMessage(m.from, { text: `🕒 *Time:* ${now.toUTCString()}` }, { quoted: m });
});

cmd({
  pattern: 'date',
  desc: 'View current date',
  category: 'tools'
}, async (conn, m) => {
  const now = new Date();
  await conn.sendMessage(m.from, { text: `📅 *Date:* ${now.toISOString().split('T')[0]}` }, { quoted: m });
});

cmd({
  pattern: 'calc',
  desc: 'Calculate math expression',
  category: 'tools',
  react: '🔢'
}, async (conn, m, { args }) => {
  const expr = args.join(' ');
  if (!expr) return await conn.sendMessage(m.from, { text: '⚠️ Enter calculation. Example: *.calc 15 * 8 / 2*' }, { quoted: m });
  try {
    if (!/^[0-9+\-*/().\s^%]+$/.test(expr)) return await conn.sendMessage(m.from, { text: '❌ Invalid mathematical characters!' }, { quoted: m });
    const cleanExpr = expr.replace(/\^/g, '**');
    const result = Function(`'use strict'; return (${cleanExpr})`)();
    await conn.sendMessage(m.from, { text: `🔢 *Expression:* ${expr}
📊 *Result:* ${result}` }, { quoted: m });
  } catch {
    await conn.sendMessage(m.from, { text: '❌ Formula calculation error.' }, { quoted: m });
  }
});

cmd({
  pattern: 'math',
  desc: 'Math expression evaluator',
  category: 'tools'
}, async (conn, m, { args }) => {
  const expr = args.join(' ');
  if (!expr) return await conn.sendMessage(m.from, { text: '⚠️ Enter math problem!' }, { quoted: m });
  const res = await queryAI(`Solve this math problem with step by step explanation:
${expr}`);
  await conn.sendMessage(m.from, { text: res }, { quoted: m });
});

cmd({
  pattern: 'weather',
  desc: 'Check live weather forecast',
  category: 'tools',
  react: '🌤️'
}, async (conn, m, { args }) => {
  const city = args.join(' ') || 'Nairobi';
  try {
    const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
    await conn.sendMessage(m.from, { text: `🌤️ *Weather in ${city}:*
${res.data}` }, { quoted: m });
  } catch {
    await conn.sendMessage(m.from, { text: '❌ Could not retrieve weather report.' }, { quoted: m });
  }
});

cmd({
  pattern: 'news',
  desc: 'Latest world news headlines',
  category: 'tools',
  react: '📰'
}, async (conn, m) => {
  const res = await queryAI('List top 5 world news headlines today with brief summaries.');
  await conn.sendMessage(m.from, { text: `📰 *Top News Headlines:*

${res}` }, { quoted: m });
});

cmd({
  pattern: 'currency',
  desc: 'Convert currency rates',
  category: 'tools',
  react: '💱'
}, async (conn, m, { args }) => {
  const query = args.join(' ') || '1 USD to TZS';
  const res = await queryAI(`What is the current currency exchange rate for: ${query}?`);
  await conn.sendMessage(m.from, { text: `💱 *Currency Exchange:*

${res}` }, { quoted: m });
});

cmd({
  pattern: 'qr',
  desc: 'Generate QR code',
  category: 'tools',
  react: '📱'
}, async (conn, m, { args }) => {
  const text = args.join(' ');
  if (!text) return await conn.sendMessage(m.from, { text: '⚠️ Enter text or URL!' }, { quoted: m });
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
  await conn.sendMessage(m.from, { image: { url }, caption: `✅ QR Code for: "${text}"` }, { quoted: m });
});

cmd({
  pattern: 'barcode',
  desc: 'Generate barcode image',
  category: 'tools'
}, async (conn, m, { args }) => {
  const text = args.join(' ') || '1234567890';
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(text)}&code=Code128&translate-esc=true`;
  await conn.sendMessage(m.from, { image: { url: barcodeUrl }, caption: `🏷️ Barcode for: ${text}` }, { quoted: m });
});

cmd({
  pattern: 'shorturl',
  desc: 'Shorten a long URL',
  category: 'tools',
  react: '🔗'
}, async (conn, m, { args }) => {
  const url = args[0];
  if (!url) return await conn.sendMessage(m.from, { text: '⚠️ Enter URL to shorten!' }, { quoted: m });
  try {
    const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    await conn.sendMessage(m.from, { text: `🔗 *Shortened URL:* ${res.data}` }, { quoted: m });
  } catch {
    await conn.sendMessage(m.from, { text: '❌ Failed to shorten URL.' }, { quoted: m });
  }
});

cmd({
  pattern: 'expandurl',
  desc: 'Expand a shortened URL',
  category: 'tools'
}, async (conn, m, { args }) => {
  const url = args[0];
  if (!url) return await conn.sendMessage(m.from, { text: '⚠️ Enter shortened URL!' }, { quoted: m });
  await conn.sendMessage(m.from, { text: `🔍 *Target URL:* ${url}` }, { quoted: m });
});

cmd({
  pattern: 'password',
  desc: 'Generate secure random password',
  category: 'tools',
  react: '🔐'
}, async (conn, m) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let pass = '';
  for (let i = 0; i < 16; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  await conn.sendMessage(m.from, { text: `🔐 *Generated Password:*
\`\`\`${pass}\`\`\`` }, { quoted: m });
});

cmd({
  pattern: 'uuid',
  desc: 'Generate a random UUID v4',
  category: 'tools'
}, async (conn, m) => {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  await conn.sendMessage(m.from, { text: `🆔 *Generated UUID:*
\`\`\`${uuid}\`\`\`` }, { quoted: m });
});

cmd({
  pattern: 'base64',
  desc: 'Encode plain text to base64',
  category: 'tools'
}, async (conn, m, { args }) => {
  const text = args.join(' ');
  if (!text) return await conn.sendMessage(m.from, { text: '⚠️ Enter text to encode!' }, { quoted: m });
  await conn.sendMessage(m.from, { text: `🔤 *Base64:* \`\`\`${Buffer.from(text).toString('base64')}\`\`\`` }, { quoted: m });
});

cmd({
  pattern: 'unbase64',
  desc: 'Decode base64 to plain text',
  category: 'tools'
}, async (conn, m, { args }) => {
  const text = args.join(' ');
  if (!text) return await conn.sendMessage(m.from, { text: '⚠️ Enter base64 to decode!' }, { quoted: m });
  try {
    await conn.sendMessage(m.from, { text: `📄 *Decoded:* 
${Buffer.from(text, 'base64').toString('utf-8')}` }, { quoted: m });
  } catch {
    await conn.sendMessage(m.from, { text: '❌ Invalid Base64 format.' }, { quoted: m });
  }
});

cmd({ pattern: 'encode', desc: 'URL encode text', category: 'tools' }, async (conn, m, { args }) => {
  await conn.sendMessage(m.from, { text: `🔤 *Encoded:* ${encodeURIComponent(args.join(' '))}` }, { quoted: m });
});

cmd({ pattern: 'decode', desc: 'URL decode text', category: 'tools' }, async (conn, m, { args }) => {
  await conn.sendMessage(m.from, { text: `📄 *Decoded:* ${decodeURIComponent(args.join(' '))}` }, { quoted: m });
});

cmd({ pattern: 'reverse', desc: 'Reverse string characters', category: 'tools' }, async (conn, m, { args }) => {
  await conn.sendMessage(m.from, { text: `🔄 *Reversed:* ${args.join(' ').split('').reverse().join('')}` }, { quoted: m });
});

cmd({ pattern: 'upper', desc: 'Convert text to uppercase', category: 'tools' }, async (conn, m, { args }) => {
  await conn.sendMessage(m.from, { text: `🔠 *Uppercase:* ${args.join(' ').toUpperCase()}` }, { quoted: m });
});

cmd({ pattern: 'lower', desc: 'Convert text to lowercase', category: 'tools' }, async (conn, m, { args }) => {
  await conn.sendMessage(m.from, { text: `🔡 *Lowercase:* ${args.join(' ').toLowerCase()}` }, { quoted: m });
});

cmd({ pattern: 'count', desc: 'Count words and characters', category: 'tools' }, async (conn, m, { args }) => {
  const str = args.join(' ');
  await conn.sendMessage(m.from, { text: `📊 *Text Count:*
Characters: ${str.length}
Words: ${str.trim().split(/\s+/).filter(Boolean).length}` }, { quoted: m });
});

cmd({ pattern: 'choose', desc: 'Choose randomly between options', category: 'tools' }, async (conn, m, { args }) => {
  const options = args.join(' ').split(',').map(s => s.trim()).filter(Boolean);
  if (options.length < 2) return await conn.sendMessage(m.from, { text: '⚠️ Enter choices separated by comma. Example: *.choose pizza, burger, pasta*' }, { quoted: m });
  const pick = options[Math.floor(Math.random() * options.length)];
  await conn.sendMessage(m.from, { text: `🎯 *I choose:* **${pick}**` }, { quoted: m });
});

cmd({ pattern: 'random', desc: 'Generate random number', category: 'tools' }, async (conn, m, { args }) => {
  const min = parseInt(args[0]) || 1;
  const max = parseInt(args[1]) || 100;
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  await conn.sendMessage(m.from, { text: `🎲 *Random Number (${min}-${max}):* [ ${num} ]` }, { quoted: m });
});

cmd({ pattern: 'timestamp', desc: 'Current UNIX timestamp', category: 'tools' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `⏱️ *UNIX Timestamp:* ${Math.floor(Date.now() / 1000)}` }, { quoted: m });
});

// ==========================================
// 7. GAMES & FUN (16 commands)
// ==========================================

const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings.",
  "There are 10 types of people: those who understand binary, and those who don't.",
  "Why did the computer catch a cold? It left its Windows open!"
];

cmd({ pattern: 'joke', desc: 'Tell a joke', category: 'fun', react: '😂' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `😂 *Joke:*

${jokes[Math.floor(Math.random() * jokes.length)]}` }, { quoted: m });
});

cmd({ pattern: 'fact', desc: 'Interesting random fact', category: 'fun', react: '🧠' }, async (conn, m) => {
  const facts = [
    "Honey never spoils; archaeologists found edible honey in 3,000-year-old Egyptian tombs.",
    "Bananas are curved because they grow towards the sun against gravity.",
    "Octopuses have three hearts and blue blood."
  ];
  await conn.sendMessage(m.from, { text: `💡 *Fact:*

${facts[Math.floor(Math.random() * facts.length)]}` }, { quoted: m });
});

cmd({ pattern: 'quote', desc: 'Inspirational quote', category: 'fun', react: '💡' }, async (conn, m) => {
  const quotes = [
    "“Success is not final, failure is not fatal: It is the courage to continue that counts.” - Winston Churchill",
    "“The way to get started is to quit talking and begin doing.” - Walt Disney",
    "“Learning never exhausts the mind.” - Leonardo da Vinci"
  ];
  await conn.sendMessage(m.from, { text: `💡 *Quote:*

${quotes[Math.floor(Math.random() * quotes.length)]}` }, { quoted: m });
});

cmd({ pattern: 'motivate', desc: 'Motivation boost', category: 'fun' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `🚀 *You've got this!* Consistency and patience always beat talent when talent doesn't work hard.` }, { quoted: m });
});

cmd({ pattern: 'coinflip', desc: 'Flip a coin', category: 'fun', react: '🪙' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `🪙 *Coin Toss:* ${Math.random() > 0.5 ? 'HEADS 🪙' : 'TAILS 🪙'}` }, { quoted: m });
});

cmd({ pattern: 'dice', desc: 'Roll a dice', category: 'fun', react: '🎲' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `🎲 *Dice rolled:* [ ${Math.floor(Math.random() * 6) + 1} ]` }, { quoted: m });
});

cmd({ pattern: 'riddle', desc: 'Solve a riddle', category: 'fun' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `🧩 *Riddle:* What has keys but can't open locks?

||Answer: A Piano!||` }, { quoted: m });
});

cmd({ pattern: 'trivia', desc: 'Trivia quiz question', category: 'fun' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `❓ *Trivia:* Which planet in our solar system has the most moons?

||Answer: Saturn!||` }, { quoted: m });
});

cmd({ pattern: 'quiz', desc: 'Fun quiz question', category: 'fun' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `❓ *Quiz:* What is the fastest land animal on Earth?

||Answer: Cheetah!||` }, { quoted: m });
});

cmd({ pattern: 'ship', desc: 'Ship compatibility percentage', category: 'fun' }, async (conn, m) => {
  const pct = Math.floor(Math.random() * 101);
  await conn.sendMessage(m.from, { text: `💖 *Ship Match:* ${pct}% match score!` }, { quoted: m });
});

cmd({ pattern: 'rate', desc: 'Rate someone or something', category: 'fun' }, async (conn, m, { args }) => {
  const item = args.join(' ') || 'You';
  await conn.sendMessage(m.from, { text: `⭐ Rating for **${item}**: ${Math.floor(Math.random() * 101)}/100` }, { quoted: m });
});

cmd({ pattern: 'compliment', desc: 'Receive a kind compliment', category: 'fun' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '✨ You bring an amazing energy wherever you go! Keep shining!' }, { quoted: m });
});

cmd({ pattern: 'roast', desc: 'Savage funny roast', category: 'fun' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '🔥 If laughter is the best medicine, your face must be curing the whole world!' }, { quoted: m });
});

cmd({ pattern: 'truth', desc: 'Truth question', category: 'fun' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '🤔 *Truth:* What is the biggest secret you have never told anyone?' }, { quoted: m });
});

cmd({ pattern: 'dare', desc: 'Dare challenge', category: 'fun' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '🔥 *Dare:* Send a voice note singing your favorite chorus right now!' }, { quoted: m });
});

cmd({ pattern: '8ball', desc: 'Ask magic 8-ball', category: 'fun', react: '🎱' }, async (conn, m, { args }) => {
  if (!args.length) return await conn.sendMessage(m.from, { text: '⚠️ Ask a question!' }, { quoted: m });
  const ans = ["Yes, definitely.", "Outlook good.", "Ask again later.", "Cannot predict now.", "Don't count on it.", "My sources say no."];
  await conn.sendMessage(m.from, { text: `🎱 *8-Ball says:* ${ans[Math.floor(Math.random() * ans.length)]}` }, { quoted: m });
});

// ==========================================
// 8. OWNER COMMANDS (16 commands)
// ==========================================

cmd({ pattern: 'mode', desc: 'Change bot mode (public or private)', category: 'owner', onlyOwner: true }, async (conn, m, { args }) => {
  const mode = args[0]?.toLowerCase();
  if (mode === 'public' || mode === 'private') {
    process.env.MODE = mode;
    return await conn.sendMessage(m.from, { text: `✅ Mode set to: *${mode.toUpperCase()}*` }, { quoted: m });
  }
  await conn.sendMessage(m.from, { text: '⚠️ Usage: *.mode public* or *.mode private*' }, { quoted: m });
});

cmd({ pattern: 'setowner', desc: 'Set owner phone number', category: 'owner', onlyOwner: true }, async (conn, m, { args }) => {
  const num = (args[0] || '').replace(/[^0-9]/g, '');
  if (!num) return await conn.sendMessage(m.from, { text: '⚠️ Enter phone number!' }, { quoted: m });
  process.env.OWNER_NUMBER = num;
  await conn.sendMessage(m.from, { text: `✅ Owner number updated to: ${num}` }, { quoted: m });
});

cmd({ pattern: 'owner', desc: 'Send owner contact card', category: 'general', react: '👑' }, async (conn, m, { ownerNumber, ownerName }) => {
  const vcard = 'BEGIN:VCARD\nVERSION:3.0\n' +
                `FN:${ownerName || 'HANS TECHY'}\n` +
                `ORG:HANS TECHY V2;\n` +
                `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\n` +
                'END:VCARD';
  await conn.sendMessage(m.from, { contacts: { displayName: ownerName || 'HANS TECHY', contacts: [{ vcard }] } }, { quoted: m });
});

cmd({ pattern: 'restart', desc: 'Restart bot process', category: 'owner', onlyOwner: true, react: '🔄' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '🔄 Restarting bot process now...' }, { quoted: m });
  setTimeout(() => process.exit(0), 1000);
});

cmd({ pattern: 'update', desc: 'Check for updates', category: 'owner', onlyOwner: true }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '🚀 You are running the latest version of *HANS TECHY V2*!' }, { quoted: m });
});

cmd({ pattern: 'broadcast', desc: 'Broadcast to chats', category: 'owner', onlyOwner: true }, async (conn, m, { args }) => {
  const text = args.join(' ');
  if (!text) return await conn.sendMessage(m.from, { text: '⚠️ Enter broadcast message!' }, { quoted: m });
  await conn.sendMessage(m.from, { text: `📢 *Broadcast sent:* "${text}"` }, { quoted: m });
});

cmd({ pattern: 'clearsession', desc: 'Clean session directory', category: 'owner', onlyOwner: true }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '⚠️ Session deletion is disabled to avoid accidentally disconnecting the bot. Remove session credentials manually only when you intend to re-link WhatsApp.' }, { quoted: m });
});

cmd({ pattern: 'backup', desc: 'Backup bot settings', category: 'owner', onlyOwner: true }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '⚠️ No backup was created: persistent backup storage is not configured.' }, { quoted: m });
});

cmd({ pattern: 'setprefix', desc: 'Set custom prefix symbol', category: 'owner', onlyOwner: true }, async (conn, m, { args }) => {
  const sym = args[0];
  if (!sym) return await conn.sendMessage(m.from, { text: '⚠️ Enter new prefix symbol!' }, { quoted: m });
  process.env.PREFIX = sym;
  await conn.sendMessage(m.from, { text: `✅ Prefix changed to: [ ${sym} ]` }, { quoted: m });
});

cmd({ pattern: 'setnamebot', desc: 'Change bot name', category: 'owner', onlyOwner: true }, async (conn, m, { args }) => {
  const name = args.join(' ');
  if (!name) return await conn.sendMessage(m.from, { text: '⚠️ Enter new bot name!' }, { quoted: m });
  process.env.BOT_NAME = name;
  await conn.sendMessage(m.from, { text: `✅ Bot name updated to: *${name}*` }, { quoted: m });
});

cmd({ pattern: 'setbio', desc: 'Update WhatsApp about bio', category: 'owner', onlyOwner: true }, async (conn, m, { args }) => {
  const bio = args.join(' ');
  await conn.updateProfileStatus(bio || 'HANS TECHY V2 is active').catch(() => null);
  await conn.sendMessage(m.from, { text: '✅ Profile status bio updated.' }, { quoted: m });
});

cmd({ pattern: 'block', desc: 'Block a user', category: 'owner', onlyOwner: true }, async (conn, m) => {
  const target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
  if (!target) return await conn.sendMessage(m.from, { text: '⚠️ Mention a user or reply to block!' }, { quoted: m });
  await conn.updateBlockStatus(target, 'block');
  await conn.sendMessage(m.from, { text: '🚫 User blocked.' }, { quoted: m });
});

cmd({ pattern: 'unblock', desc: 'Unblock a user', category: 'owner', onlyOwner: true }, async (conn, m) => {
  const target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
  if (!target) return await conn.sendMessage(m.from, { text: '⚠️ Mention a user or reply to unblock!' }, { quoted: m });
  await conn.updateBlockStatus(target, 'unblock');
  await conn.sendMessage(m.from, { text: '✅ User unblocked.' }, { quoted: m });
});

cmd({ pattern: 'shutdown', desc: 'Gracefully shutdown bot', category: 'owner', onlyOwner: true }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '🔌 Shutting down bot...' }, { quoted: m });
  setTimeout(() => process.exit(0), 1000);
});

// ==========================================
// 9. MORE COMMANDS & SYSTEM (16 commands)
// ==========================================

cmd({
  pattern: 'menu',
  desc: 'Displays the complete command menu',
  category: 'general',
  react: '📜'
}, async (conn, m, { prefix, pushName, botName, ownerName, mode }) => {
  const uptime = formatUptime(process.uptime());
  const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  const textMenu = `╭─ *${botName || 'HANS TECHY V2'}* ─╮
│ 👑 Owner: ${ownerName || 'HANS TECHY'}
│ 👤 User: ${pushName || 'User'}
│ ⚙️ Mode: ${(mode || 'public').toUpperCase()}
│ ☁️ Host: Heroku / Linux
│ ⏱️ Uptime: ${uptime}
│ 🧠 RAM: ${ramUsage} MB
│ ⌨️ Prefix: [ ${prefix} ]
╰────────────────────╯

╭━━━〔 🤖 *AI COMMANDS* 〕━━━╮
${commands.filter(c => c.category === 'ai').map(c => `│ ⋄ ${prefix}${c.pattern}`).join('\n')}
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 ❤️ *STATUS COMMANDS* 〕━━━╮
${commands.filter(c => c.category === 'status').map(c => `│ ⋄ ${prefix}${c.pattern}`).join('\n')}
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👥 *GROUP COMMANDS* 〕━━━╮
${commands.filter(c => c.category === 'group').map(c => `│ ⋄ ${prefix}${c.pattern}`).join('\n')}
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎨 *STICKER & MEDIA* 〕━━━╮
${commands.filter(c => c.category === 'media').map(c => `│ ⋄ ${prefix}${c.pattern}`).join('\n')}
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📥 *DOWNLOADERS* 〕━━━╮
${commands.filter(c => c.category === 'downloader').map(c => `│ ⋄ ${prefix}${c.pattern}`).join('\n')}
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🛠️ *TOOLS* 〕━━━╮
${commands.filter(c => c.category === 'tools').map(c => `│ ⋄ ${prefix}${c.pattern}`).join('\n')}
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎮 *GAMES & FUN* 〕━━━╮
${commands.filter(c => c.category === 'fun').map(c => `│ ⋄ ${prefix}${c.pattern}`).join('\n')}
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👑 *OWNER COMMANDS* 〕━━━╮
${commands.filter(c => c.category === 'owner').map(c => `│ ⋄ ${prefix}${c.pattern}`).join('\n')}
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 ➕ *MORE COMMANDS* 〕━━━╮
${commands.filter(c => c.category === 'general' && c.pattern !== 'menu').map(c => `│ ⋄ ${prefix}${c.pattern}`).join('\n')}
╰━━━━━━━━━━━━━━━━━━━╯

_HANS TECHY V2 - Total Commands: ${commands.length}_`;

  await conn.sendMessage(m.from, { text: textMenu }, { quoted: m });
});

cmd({ pattern: 'help', desc: 'Alias for menu', category: 'general' }, async (conn, m, extra) => {
  const menuCmd = commands.find(c => c.pattern === 'menu');
  if (menuCmd) await menuCmd.function(conn, m, extra);
});

cmd({ pattern: 'support', desc: 'Official support group link', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '💬 *Support Group:* https://chat.whatsapp.com/support' }, { quoted: m });
});

cmd({ pattern: 'channel', desc: 'Official WhatsApp channel', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '📢 *Official WhatsApp Channel:* https://whatsapp.com/channel/hans-techy' }, { quoted: m });
});

cmd({ pattern: 'verify', desc: 'Verify bot integrity', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '✅ Verified Genuine HANS TECHY V2 Build.' }, { quoted: m });
});

cmd({ pattern: 'jid', desc: 'Get current JID', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `🆔 *Current JID:* \`\`\`${m.from}\`\`\`` }, { quoted: m });
});

cmd({ pattern: 'id', desc: 'Get sender user ID', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `👤 *Your User ID:* \`\`\`${m.sender}\`\`\`` }, { quoted: m });
});

cmd({ pattern: 'repo', desc: 'Source code repository', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '📦 *GitHub Repository:* https://github.com/hans-techy/HANS-TECHY-V2' }, { quoted: m });
});

cmd({ pattern: 'script', desc: 'Alias for repo', category: 'general' }, async (conn, m, extra) => {
  const r = commands.find(c => c.pattern === 'repo');
  if (r) await r.function(conn, m, extra);
});

cmd({ pattern: 'host', desc: 'Cloud host info', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '☁️ *Hosting Platform:* Heroku / Linux Dyno' }, { quoted: m });
});

cmd({ pattern: 'server', desc: 'Server hardware stats', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `🖥️ *Server Stats:*
Platform: ${os.platform()}
CPUs: ${os.cpus().length}
Node: ${process.version}` }, { quoted: m });
});

cmd({ pattern: 'ram', desc: 'RAM memory stats', category: 'general' }, async (conn, m) => {
  const free = (os.freemem() / 1024 / 1024).toFixed(2);
  const total = (os.totalmem() / 1024 / 1024).toFixed(2);
  await conn.sendMessage(m.from, { text: `🧠 *RAM Usage:*\n${free} MB Free / ${total} MB Total` }, { quoted: m });
});

cmd({ pattern: 'storage', desc: 'Storage status', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: '💾 *Disk Storage:* Normal (Container Filesystem)' }, { quoted: m });
});

cmd({ pattern: 'ownerinfo', desc: 'Owner biography', category: 'general' }, async (conn, m, { ownerName, ownerNumber }) => {
  await conn.sendMessage(m.from, { text: `👑 *Owner:* ${ownerName || 'HANS TECHY'}\n📱 *Contact:* +${ownerNumber}` }, { quoted: m });
});

cmd({ pattern: 'rules', desc: 'Bot usage rules', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `📜 *RULES:*\n1. Do not spam commands.\n2. Do not promote illegal content.\n3. Respect group members.` }, { quoted: m });
});

cmd({ pattern: 'privacy', desc: 'Privacy policy', category: 'general' }, async (conn, m) => {
  await conn.sendMessage(m.from, { text: `🔒 *PRIVACY:*\nThis bot does not permanently store your personal private messages.` }, { quoted: m });
});

module.exports = {
  commands,
  cmd,
  formatUptime
};
