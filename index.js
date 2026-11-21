const express = require('express');
const config = require('./config');
const { startBot, botStatus } = require('./bot');

const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${config.BOT_NAME} Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 2.5rem; border-radius: 16px; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,0.6); max-width: 420px; width: 90%; }
          .status { display: inline-block; padding: 8px 18px; border-radius: 999px; font-weight: 700; margin: 16px 0; background: ${botStatus.connected ? '#22c55e' : '#eab308'}; color: #000; }
          h1 { margin: 0; font-size: 1.6rem; color: #38bdf8; }
          p { color: #94a3b8; font-size: 0.95rem; margin: 6px 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${config.BOT_NAME}</h1>
          <div class="status">${botStatus.connected ? 'ONLINE ✅' : 'INASUBIRI SESSION / MUUNGANISHO ⏳'}</div>
          <p>Namba ya Bot: <b>${botStatus.user || 'Inapakia...'}</b></p>
          <p>Prefix: <b>${config.PREFIX}</b></p>
          <p>Owner: <b>${config.OWNER_NAME}</b></p>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/status', (req, res) => {
  res.json({
    online: botStatus.connected,
    user: botStatus.user,
    botName: config.BOT_NAME
  });
});

app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`🌐 Live Dashboard active on port ${config.PORT}`);
  startBot().catch(err => console.error('Kosa la kuanzisha bot:', err));
});
