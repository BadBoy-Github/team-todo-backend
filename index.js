const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
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
}

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app; // For Vercel Serverless
