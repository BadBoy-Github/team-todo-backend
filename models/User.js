const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['completed', 'incomplete'],
    default: 'incomplete',
  },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  age: {
    type: Number,
  },
  sex: {
    type: String,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  tasks: [TaskSchema],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
