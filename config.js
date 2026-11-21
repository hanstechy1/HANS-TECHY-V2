require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  PREFIX: process.env.PREFIX || '.',
  BOT_NAME: process.env.BOT_NAME || 'HANS TECHY V2',
  OWNER_NAME: process.env.OWNER_NAME || 'HANS TECHY',
  OWNER_NUMBER: (process.env.OWNER_NUMBER || '255686005775').replace(/\D/g, ''),
  SESSION_ID: (process.env.SESSION_ID || '').trim(),
  BOT_MODE: 'PUBLIC'
};
