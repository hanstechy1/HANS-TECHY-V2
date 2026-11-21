module.exports = {
  SESSION_ID: process.env.SESSION_ID || '',
  PREFIX: process.env.PREFIX || '.',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '2557XXXXXXXX', // Weka namba yako bila +
  BOT_NAME: process.env.BOT_NAME || 'HANS TECHY BOT',
  MODE: process.env.MODE || 'public', // 'public' au 'private'
  PORT: process.env.PORT || 3000
};
