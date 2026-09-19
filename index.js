const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cron = require('node-cron');
const { sendPendingTaskReminders } = require('./services/emailService');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ── Shared HTML shell ──────────────────────────────────────────────────────────
const renderPage = (title, bodyContent) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — VitaSyn API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-base:       #0f1015;
      --bg-surface:    #151720;
      --bg-elevated:   #1c1e2b;
      --bg-card:       #191b26;
      --lavender:      #bda6f7;
      --lavender-dark: #9374eb;
      --mint:          #abecda;
      --mint-dark:     #58cfad;
      --text-primary:  #f3f4f8;
      --text-secondary:#a3a8b8;
      --text-muted:    #646b80;
      --border:        rgba(189,166,247,0.14);
      --border-lav:    rgba(189,166,247,0.24);
    }
    body {
      background: var(--bg-base);
      color: var(--text-primary);
      font-family: 'Inter', system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    /* Ambient glows */
    body::before, body::after {
      content: '';
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(120px);
      z-index: 0;
    }
    body::before {
      width: 480px; height: 480px;
      top: -120px; right: -120px;
      background: rgba(189,166,247,0.06);
    }
    body::after {
      width: 480px; height: 480px;
      bottom: -120px; left: -120px;
      background: rgba(171,236,218,0.06);
    }
    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 560px;
      padding: 24px 16px;
    }
    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    .brand-name { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; line-height: 1; }
    .brand-name .vita { color: #fff; }
    .brand-name .syn  { color: var(--lavender); }
    .brand-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--mint);
      box-shadow: 0 0 8px var(--mint);
      flex-shrink: 0;
    }
    .brand-sub {
      font-size: 9px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 2.5px; color: var(--text-muted);
    }
    /* Card */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 36px 32px;
      box-shadow: 0 4px 32px -4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
    }
    .card-header { margin-bottom: 28px; }
    .label {
      display: inline-block;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1.8px;
      padding: 4px 14px; border-radius: 999px;
      margin-bottom: 16px;
    }
    .label-lavender {
      background: rgba(189,166,247,0.12);
      color: var(--lavender);
      border: 1px solid rgba(189,166,247,0.28);
    }
    .label-mint {
      background: rgba(171,236,218,0.1);
      color: var(--mint-dark);
      border: 1px solid rgba(171,236,218,0.25);
    }
    h1 {
      font-size: 26px; font-weight: 900; letter-spacing: -0.5px;
      line-height: 1.2; color: var(--text-primary);
      margin-bottom: 10px;
    }
    h1 span {
      background: linear-gradient(135deg, var(--lavender) 0%, var(--mint) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      font-size: 14px; color: var(--text-secondary); line-height: 1.6;
    }
    /* Divider */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, var(--border-lav) 40%, rgba(171,236,218,0.2) 70%, transparent 100%);
      margin: 24px 0;
    }
    /* Info rows */
    .info-grid { display: flex; flex-direction: column; gap: 10px; }
    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
      gap: 12px;
    }
    .info-key {
      font-size: 12px; font-weight: 600;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px;
      flex-shrink: 0;
    }
    .info-val {
      font-size: 13px; font-weight: 600; color: var(--text-primary);
      text-align: right; word-break: break-all;
    }
    /* Status badges */
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 700; padding: 3px 12px;
      border-radius: 999px; letter-spacing: 0.4px;
    }
    .badge-ok {
      background: rgba(171,236,218,0.1); color: var(--mint-dark);
      border: 1px solid rgba(171,236,218,0.28);
    }
    .badge-error {
      background: rgba(255,100,100,0.1); color: #f87171;
      border: 1px solid rgba(255,100,100,0.25);
    }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    /* Footer link */
    .footer {
      margin-top: 24px; text-align: center;
      font-size: 12px; color: var(--text-muted);
    }
    .footer a {
      color: var(--lavender); text-decoration: none;
      border-bottom: 1px solid rgba(189,166,247,0.3);
      padding-bottom: 1px;
    }
    .footer a:hover { color: #fff; border-color: #fff; }
    @media (max-width: 480px) {
      .card { padding: 28px 20px; }
      h1 { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">
      <div>
        <div class="brand-name"><span class="vita">Vita</span><span class="syn">Syn</span></div>
        <div class="brand-sub">VitaSyn Pvt Ltd</div>
      </div>
      <div class="brand-dot"></div>
    </div>
    <div class="card">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>VitaSyn Team ToDo &nbsp;&middot;&nbsp; <a href="https://vitasyn-team-todo.vercel.app/" target="_blank" rel="noopener">vitasyn-team-todo.vercel.app</a></p>
    </div>
  </div>
</body>
</html>`;

// ── Root Route ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const timestamp = new Date().toISOString();
  const html = renderPage('API Home', `
    <div class="card-header">
      <span class="label label-lavender">API Status</span>
      <h1>This is <span>not</span> a 404 page</h1>
      <p class="subtitle">You've reached the VitaSyn Team ToDo backend API. Everything is up and running.</p>
    </div>
    <div class="divider"></div>
    <div class="info-grid">
      <div class="info-row">
        <span class="info-key">Status</span>
        <span class="badge badge-ok"><span class="badge-dot"></span>Running</span>
      </div>
      <div class="info-row">
        <span class="info-key">Message</span>
        <span class="info-val">VitaSyn Team ToDo API is running</span>
      </div>
      <div class="info-row">
        <span class="info-key">Timestamp</span>
        <span class="info-val">${timestamp}</span>
      </div>

    </div>
  `);
  res.status(200).send(html);
});

// ── Health Route ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const uptimeSeconds = process.uptime();
  const hours   = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const timestamp = new Date().toISOString();

  const dbBadge = dbState === 'connected'
    ? `<span class="badge badge-ok"><span class="badge-dot"></span>Connected</span>`
    : `<span class="badge badge-error"><span class="badge-dot"></span>Disconnected</span>`;

  const html = renderPage('Health Checkup', `
    <div class="card-header">
      <span class="label label-mint">Health Checkup</span>
      <h1>System is <span>healthy</span></h1>
      <p class="subtitle">Live diagnostics for the VitaSyn Team ToDo backend server.</p>
    </div>
    <div class="divider"></div>
    <div class="info-grid">
      <div class="info-row">
        <span class="info-key">API Status</span>
        <span class="badge badge-ok"><span class="badge-dot"></span>Healthy</span>
      </div>
      <div class="info-row">
        <span class="info-key">Database</span>
        ${dbBadge}
      </div>
      <div class="info-row">
        <span class="info-key">Uptime</span>
        <span class="info-val">${uptimeStr}</span>
      </div>
      <div class="info-row">
        <span class="info-key">Uptime (raw)</span>
        <span class="info-val">${uptimeSeconds.toFixed(2)}s</span>
      </div>
      <div class="info-row">
        <span class="info-key">Timestamp</span>
        <span class="info-val">${timestamp}</span>
      </div>
      <div class="info-row">
        <span class="info-key">Node.js</span>
        <span class="info-val">${process.version}</span>
      </div>
      <div class="info-row">
        <span class="info-key">Environment</span>
        <span class="info-val">${process.env.NODE_ENV || 'development'}</span>
      </div>
    </div>
  `);
  res.status(200).send(html);
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn("MONGODB_URI is not defined in environment variables");
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Seed Admin
    await seedAdmin();

    // ── Email Reminder Scheduler ───────────────────────────────────────────────
    //
    // 🧪 DEV / TESTING MODE:
    //   Runs immediately on every backend startup so you can verify emails work
    //   right away. Once you've confirmed emails are received correctly, comment
    //   out the line below (sendPendingTaskReminders()) and keep only the cron.
    //
    // 🚀 PRODUCTION MODE:
    //   Comment out the immediate call below. The cron will fire daily at the
    //   time configured in REMINDER_CRON_SCHEDULE (default: 10:00 AM server time).
    // ──────────────────────────────────────────────────────────────────────────

    // DEV: Trigger immediately on startup for testing
    console.log('[EmailService] 🧪 DEV MODE – Running email check immediately on startup...');
    sendPendingTaskReminders(); // ← Comment this out once testing is complete

    // PRODUCTION: Daily cron job (keep this always active)
    const cronSchedule = process.env.REMINDER_CRON_SCHEDULE || '0 10 * * *';
    if (cron.validate(cronSchedule)) {
      cron.schedule(cronSchedule, () => {
        console.log(`[EmailService] ⏰ Cron triggered at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
        sendPendingTaskReminders();
      }, {
        scheduled: true,
        timezone: 'Asia/Kolkata' // Ensures cron runs at IST time
      });
      console.log(`[EmailService] 📅 Daily reminder cron scheduled: "${cronSchedule}" (IST timezone)`);
    } else {
      console.error(`[EmailService] ❌ Invalid cron expression in REMINDER_CRON_SCHEDULE: "${cronSchedule}"`);
    }

  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    const User = require('./models/User');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vitasyn.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let admin = await User.findOne({ role: 'admin' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    if (!admin) {
      admin = new User({
        userId: 'admin_vitasyn',
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin seeded successfully');
    } else {
      // Update admin credentials if they exist in DB but differ from env (for safety during development)
      admin.email = adminEmail;
      admin.password = hashedPassword;
      await admin.save();
      console.log('Admin credentials updated from environment');
    }
  } catch (err) {
    console.error('Error seeding admin:', err.message);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app; // For Vercel Serverless
