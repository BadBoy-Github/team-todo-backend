const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Meeting = require('../models/Meeting');

// @route   GET /api/meetings
// @desc    Get all meetings (or optionally filtered by date / month)
// @access  Private (All authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const { date, month } = req.query;
    let query = {};

    if (date) {
      query.date = date; // e.g. "2026-09-26"
    } else if (month) {
      // Regex for month prefix e.g. "2026-09"
      query.date = new RegExp(`^${month}`);
    }

    const meetings = await Meeting.find(query).sort({ date: 1, startTime: 1 });
    res.json(meetings);
  } catch (err) {
    console.error('Error fetching meetings:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/meetings/:id
// @desc    Get single meeting by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err) {
    console.error('Error fetching meeting:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/meetings
// @desc    Create a new meeting
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, date, meetingLink, startTime, endTime, summaryNotes } = req.body;

  if (!date || !meetingLink || !startTime || !endTime) {
    return res.status(400).json({
      message: 'Date, meeting link, starting time, and ending time are required',
    });
  }

  try {
    const newMeeting = new Meeting({
      title: title && title.trim() ? title.trim() : 'Team Meeting',
      date: date.trim(),
      meetingLink: meetingLink.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      summaryNotes: summaryNotes !== undefined ? summaryNotes.trim() : '',
      createdBy: req.user ? req.user.id : null,
      creatorName: req.user ? req.user.name : 'Team Member',
    });

    const savedMeeting = await newMeeting.save();
    res.status(201).json(savedMeeting);
  } catch (err) {
    console.error('Error creating meeting:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/meetings/:id
// @desc    Update a meeting (details or summary notes)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { title, date, meetingLink, startTime, endTime, summaryNotes } = req.body;

  try {
    let meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (title !== undefined) meeting.title = title.trim();
    if (date !== undefined) meeting.date = date.trim();
    if (meetingLink !== undefined) meeting.meetingLink = meetingLink.trim();
    if (startTime !== undefined) meeting.startTime = startTime.trim();
    if (endTime !== undefined) meeting.endTime = endTime.trim();
    if (summaryNotes !== undefined) meeting.summaryNotes = summaryNotes;

    const updatedMeeting = await meeting.save();
    res.json(updatedMeeting);
  } catch (err) {
    console.error('Error updating meeting:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/meetings/:id
// @desc    Delete a meeting
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting removed successfully', id: req.params.id });
  } catch (err) {
    console.error('Error deleting meeting:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
