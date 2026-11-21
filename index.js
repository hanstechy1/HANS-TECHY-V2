const express = require('express');
const config = require('./config');
const { startBot, botStatus } = require('./bot');

const app = express();

// Dashboard ya kuangalia hali ya Bot
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${config.BOT_NAME} Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 2rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5); max-width: 400px; width: 90%; }
          .status { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: bold; margin: 12px 0; background: ${botStatus.connected ? '#22c55e' : '#ef4444'}; color: #fff; }
          h1 { margin: 0; font-size: 1.5rem; color: #38bdf8; }
          p { color: #94a3b8; font-size: 0.95rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${config.BOT_NAME}</h1>
          <div class="status">${botStatus.connected ? 'ONLINE ✅' : 'INASUBIRI MUUNGANISHO ⏳'}</div>
          <p>Namba ya Bot: <b>${botStatus.user || 'Inapakia...'}</b></p>
          <p>Prefix: <b>${config.PREFIX}</b></p>
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

// Anzisha Web Server
app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`Server inafanya kazi kwenye port: ${config.PORT}`);
  // Anzisha muunganisho wa Bot
  startBot().catch(err => console.error('Kosa la kuanzisha bot:', err));
});
