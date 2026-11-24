require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  PREFIX: process.env.PREFIX || '.',
  BOT_NAME: process.env.BOT_NAME || 'HANS TECHY V2',
  OWNER_NAME: process.env.OWNER_NAME || 'HANS TECHY',
  OWNER_NUMBER: (process.env.OWNER_NUMBER || '255757462570').replace(/\D/g, ''),
  SESSION_ID: (process.env.SESSION_ID || '').trim(),
  
  // Link ya Seva yako ya Generator (API)
  API_URL: process.env.API_URL || 'https://session-generater-5c821fc67ec3.herokuapp.com',
  BOT_MODE: (process.env.BOT_MODE || 'PUBLIC').toUpperCase()
};

