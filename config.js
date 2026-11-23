require('dotenv').config();

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  PREFIX: process.env.PREFIX || '.',
  BOT_NAME: process.env.BOT_NAME || 'HANS TECHY V2',
  OWNER_NAME: process.env.OWNER_NAME || 'HANS TECHY',
  // Set this in the hosting dashboard; never rely on a hard-coded personal number.
  OWNER_NUMBER: (process.env.OWNER_NUMBER || '').replace(/\D/g, ''),
  SESSION_ID: (process.env.SESSION_ID || '').trim(),
  BOT_MODE: (process.env.MODE || 'public').toUpperCase()
};

