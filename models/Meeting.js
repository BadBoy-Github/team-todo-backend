const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Team Meeting',
    trim: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true,
  },
  meetingLink: {
    type: String,
    required: true,
    trim: true,
  },
  startTime: {
    type: String, // Format: "hh:mm AM/PM" e.g. "10:00 AM"
    required: true,
    trim: true,
  },
  endTime: {
    type: String, // Format: "hh:mm AM/PM" e.g. "11:00 AM"
    required: true,
    trim: true,
  },
  summaryNotes: {
    type: String, // Optional text area for notes/takeaways
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  creatorName: {
    type: String,
    default: 'Team Member',
  },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);
