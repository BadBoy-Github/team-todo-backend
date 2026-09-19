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

// Health & Root Routes
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'VitaSyn Team ToDo API is running',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
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
