// index.js - HANS TECHY V2 Dashboard & Launcher
const express = require('express');
const config = require('./config');
const { startBot, botStatus } = require('./bot');

const app = express();
const PORT = process.env.PORT || config.PORT || 3000;
const startTime = Date.now();

// API Endpoint kwa ajili ya kuangalia hali
app.get('/api/status', (req, res) => {
  const isOnline = Boolean(botStatus?.connected);
  res.json({
    status: isOnline ? 'ONLINE' : 'CONNECTING',
    bot: config.BOT_NAME || 'HANS TECHY V2',
    owner: config.OWNER_NUMBER || '',
    commands_loaded: 130,
    speed: 'Ultra Fast ⚡',
    ram: `${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`,
    uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`
  });
});

// Live Web Dashboard
app.get('/', (req, res) => {
  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const ram = (process.memoryUsage().rss / (1024 * 1024)).toFixed(1);
    const isOnline = Boolean(botStatus?.connected);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.BOT_NAME || 'HANS TECHY V2'} — Live Status Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #050811;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 36px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
      background: ${isOnline ? 'rgba(0, 255, 136, 0.1)' : 'rgba(234, 179, 8, 0.1)'};
      color: ${isOnline ? '#00ff88' : '#eab308'};
      border: 1px solid ${isOnline ? 'rgba(0, 255, 136, 0.3)' : 'rgba(234, 179, 8, 0.3)'};
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${isOnline ? '#00ff88' : '#eab308'};
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 28px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
      text-align: left;
    }
    .card-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
    }
    .card-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
      margin-top: 4px;
    }
    .btn-group {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    .btn {
      flex: 1;
      padding: 12px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      text-align: center;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #25d366;
      color: #050811;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">
      <span class="badge-dot"></span>
      ${isOnline ? 'WhatsApp Connected ⚡' : 'Connecting WhatsApp ⏳'}
    </div>

    <h1>${config.BOT_NAME || 'HANS TECHY V2'}</h1>
    <p class="subtitle">Multi-Device Automation Bot Service</p>

    <div class="grid">
      <div class="card">
        <div class="card-label">Server Status</div>
        <div class="card-value" style="color: ${isOnline ? '#00ff88' : '#eab308'};">
          ${isOnline ? 'ONLINE' : 'CONNECTING'}
        </div>
      </div>
      <div class="card">
        <div class="card-label">Commands</div>
        <div class="card-value">130+ Active</div>
      </div>
      <div class="card">
        <div class="card-label">RAM Usage</div>
        <div class="card-value">${ram} MB</div>
      </div>
      <div class="card">
        <div class="card-label">Uptime</div>
        <div class="card-value">${uptime}s</div>
      </div>
    </div>

    <div class="btn-group">
      <a href="https://wa.me/${config.OWNER_NUMBER}" class="btn btn-primary" target="_blank">
        💬 Chat Owner
      </a>
      <a href="https://generatepaircode.lovable.app" class="btn btn-secondary" target="_blank">
        🔑 Pair Code
      </a>
    </div>
  </div>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error('Dashboard render error:', err);
    res.status(200).send('<h1>HANS TECHY V2 is Running</h1><p>Dashboard is loading...</p>');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Live Dashboard active on port ${PORT}`);
  startBot().catch((err) => console.error('Bot startup error:', err));
});
