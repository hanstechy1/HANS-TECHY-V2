const express = require('express');
const config = require('./config');
const { startBot, botStatus } = require('./bot');

const app = express();

app.get('/api/status', (req, res) => {
  res.json({
    status: botStatus.connected ? 'ONLINE' : 'OFFLINE',
    bot: config.BOT_NAME,
    owner: config.OWNER_NUMBER,
    commands_loaded: 130,
    speed: 'Ultra Fast ⚡',
    ram: `${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`,
    uptime: `${Math.floor(process.uptime())}s`
  });
});

app.get('/', (req, res) => {
  const uptime = Math.floor(process.uptime());
  const ram = (process.memoryUsage().rss / (1024 * 1024)).toFixed(1);
  const isOnline = botStatus.connected;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.BOT_NAME} — Live Status Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: radial-gradient(circle at 50% 0%, #0d1b2a 0%, #050811 100%);
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
      position: relative;
    }
    .bg-glow {
      position: absolute;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(0, 255, 136, 0.18) 0%, rgba(0, 210, 255, 0.08) 50%, transparent 70%);
      filter: blur(70px);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: floatGlow 7s ease-in-out infinite alternate;
      z-index: 0;
      pointer-events: none;
    }
    @keyframes floatGlow {
      0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.7; }
      100% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    }
    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 620px;
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(0, 255, 136, 0.25);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      border-radius: 28px;
      padding: 38px 32px;
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 255, 136, 0.15);
      text-align: center;
      animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .pulse-wrapper {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid #00ff88;
      opacity: 0;
      animation: pulseWave 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
    }
    .pulse-ring:nth-child(2) { animation-delay: 0.8s; }
    .pulse-ring:nth-child(3) { animation-delay: 1.6s; }
    @keyframes pulseWave {
      0% { transform: scale(0.4); opacity: 0.9; }
      100% { transform: scale(1.9); opacity: 0; }
    }
    .pulse-core {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00ff88 0%, #00d2ff 100%);
      box-shadow: 0 0 30px #00ff88;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      animation: coreBreath 2s ease-in-out infinite alternate;
    }
    @keyframes coreBreath {
      0% { transform: scale(0.92); box-shadow: 0 0 15px #00ff88; }
      100% { transform: scale(1.1); box-shadow: 0 0 35px #00d2ff; }
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 255, 136, 0.12);
      border: 1px solid rgba(0, 255, 136, 0.35);
      padding: 7px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      color: #00ff88;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-bottom: 14px;
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
    }
    .badge-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #00ff88;
      box-shadow: 0 0 10px #00ff88;
      animation: blink 1.2s infinite;
    }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
    h1 {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: #94a3b8;
      font-size: 15px;
      margin-bottom: 28px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }
    .card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 18px 16px;
      text-align: left;
      transition: all 0.3s ease;
    }
    .card:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(0, 255, 136, 0.4);
      transform: translateY(-3px);
      box-shadow: 0 10px 25px -5px rgba(0, 255, 136, 0.15);
    }
    .card-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .card-value {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      font-family: 'JetBrains Mono', monospace;
    }
    .btn-group {
      display: flex;
      gap: 12px;
      flex-direction: column;
    }
    @media (min-width: 480px) {
      .btn-group { flex-direction: row; }
    }
    .btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.25s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #00ff88 0%, #00d2ff 100%);
      color: #050811;
      box-shadow: 0 4px 20px rgba(0, 255, 136, 0.35);
    }
    .btn-primary:hover {
      transform: scale(1.03);
      box-shadow: 0 8px 30px rgba(0, 255, 136, 0.6);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #f1f5f9;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(0, 255, 136, 0.3);
      transform: scale(1.02);
    }
    .footer {
      margin-top: 26px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>

  <div class="container">
    <div class="pulse-wrapper">
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-core">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#050811" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
    </div>

    <div class="badge">
      <span class="badge-dot"></span>
      System Active 24/7
    </div>

    <h1>${config.BOT_NAME}</h1>
    <p class="subtitle">Ultra-Fast WhatsApp Multi-Device Automation Bot</p>

    <div class="grid">
      <div class="card">
        <div class="card-label">Server Status</div>
        <div class="card-value" style="color: ${isOnline ? '#00ff88' : '#eab308'};">
          ${isOnline ? 'ONLINE ⚡' : 'WAITING SESSION ⏳'}
        </div>
      </div>
      <div class="card">
        <div class="card-label">Active Commands</div>
        <div class="card-value">130+ Ready</div>
      </div>
      <div class="card">
        <div class="card-label">Memory Usage</div>
        <div class="card-value">${ram} MB</div>
      </div>
      <div class="card">
        <div class="card-label">Uptime Live</div>
        <div class="card-value" id="uptime-val">${uptime}s</div>
      </div>
    </div>

    <div class="btn-group">
      <a href="https://wa.me/${config.OWNER_NUMBER}" class="btn btn-primary" target="_blank">
        💬 Chat With Owner
      </a>
      <a href="https://generatepaircode.lovable.app" class="btn btn-secondary" target="_blank">
        🔑 Pair Code Portal
      </a>
    </div>

    <div class="footer">
      Powered by HANS TECHY Engine • Node ${process.version} • Heroku Cloud
    </div>
  </div>

  <script>
    let sec = ${uptime};
    setInterval(() => {
      sec++;
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      document.getElementById('uptime-val').innerText = h > 0 ? \`\${h}h \${m}m \${s}s\` : \`\${m}m \${s}s\`;
    }, 1000);
  </script>
</body>
</html>`;

  res.send(html);
});

app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`🌐 Live Dashboard active on port ${config.PORT}`);
  startBot().catch(err => console.error('Kosa la kuanzisha bot:', err));
});
