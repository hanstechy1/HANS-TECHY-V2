// bot.js - (NO app.listen here!)
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');
const { handleCommand } = require('./command');
const botStatus = { connected: false };


async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
       if (connection === 'close') {
      botStatus.connected = false;
      // ...
    } else if (connection === 'open') {
      botStatus.connected = true;
      console.log(`🚀 ${config.BOT_NAME || 'HANS TECHY V2'} is connected and active!`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg?.message) return;
    await handleCommand(sock, msg);
  });
}

module.exports = { startBot, botstatus };
