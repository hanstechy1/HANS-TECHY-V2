const express = require('express');
const config = require('./config');
const { startBot, botStatus } = require('./bot');

const app = express();

app.get('/', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - botStatus.startTime) / 1000);
  res.json({
    bot: config.BOT_NAME,
    status: botStatus.connected ? 'ONLINE' : 'CONNECTING',
    user: botStatus.user || 'Unknown',
    uptime: `${uptimeSeconds}s`
  });
});

app.listen(config.PORT, () => {
  console.log(`[HANS TECHY V2] Web dashboard listening on port ${config.PORT}`);
  startBot().catch((err) => {
    console.error('[HANS TECHY V2] Bot startup error:', err.message);
  });
});
