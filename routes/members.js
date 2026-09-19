const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { auth, admin } = require('../middleware/auth');
const User = require('../models/User');

// Generate 13 char alphanumeric ID
const generateUserId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// @route   GET /api/members
// @desc    Get all members and their tasks
// @access  Private (All authenticated users can read)
router.get('/', auth, async (req, res) => {
  try {
    const members = await User.find({ role: 'member' }).select('-password');
    // Normalize any legacy 'incomplete' or missing task statuses to 'dormant'
    for (const member of members) {
      let changed = false;
      for (const task of member.tasks) {
        if (!task.status || task.status === 'incomplete') {
          task.status = 'dormant';
          changed = true;
        }
      }
      if (changed) {
        await member.save();
      }
    }

    // If user is a member (not admin), do not leak fellow members' phone numbers and email IDs
    if (req.user.role !== 'admin') {
      const sanitized = members.map(m => {
        const obj = m.toObject();
        if (obj._id.toString() !== req.user.id) {
          delete obj.phone;
          delete obj.email;
        }
        return obj;
      });
      return res.json(sanitized);
    }

    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/members
// @desc    Create a new member
// @access  Private/Admin
router.post('/', [auth, admin], async (req, res) => {
  const { name, email, phone, age, sex, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const userId = generateUserId();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      userId,
      name,
      email,
      phone,
      age,
      sex,
      password: hashedPassword,
      role: 'member'
    });

    await user.save();
    
    // Return user without password
    const userToReturn = user.toObject();
    delete userToReturn.password;
    
    res.json(userToReturn);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/members/:id
// @desc    Update a member
// @access  Private (Admin or Member themselves)
router.put('/:id', auth, async (req, res) => {
  const { name, email, phone, age, sex, password } = req.body;

  try {
    // Only allow admin or the member themselves
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this member' });
    }

    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.age = age || user.age;
    user.sex = sex || user.sex;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    
    const userToReturn = user.toObject();
    delete userToReturn.password;
    
    res.json(userToReturn);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/members/:id
// @desc    Delete a member
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/members/:id/tasks
// @desc    Add a task to a member
// @access  Private/Admin
router.post('/:id/tasks', [auth, admin], async (req, res) => {
  const { title, description } = req.body;

  try {
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });

    const newTask = {
      title,
      description,
      status: 'dormant'
    };

    user.tasks.push(newTask);
    await user.save();

    res.json(user.tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/members/:id/tasks/:taskId
// @desc    Update a task (title/desc)
// @access  Private/Admin
router.put('/:id/tasks/:taskId', [auth, admin], async (req, res) => {
  const { title, description } = req.body;

  try {
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });

    const task = user.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.title = title || task.title;
    task.description = description || task.description;

    await user.save();
    res.json(user.tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/members/:id/tasks/:taskId/status
// @desc    Update task status (Admin OR the member themselves)
//          Accepts: status ('dormant' | 'in_progress' | 'completed')
//          Optional: finalDescription (saved when marking completed)
// @access  Private
router.patch('/:id/tasks/:taskId/status', auth, async (req, res) => {
  const { status, finalDescription } = req.body;

  const validStatuses = ['dormant', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    // Allow admin OR the member themselves to update task status
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });

    const task = user.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = status;

    // Save finalDescription when completing; clear it when reverting
    if (status === 'completed' && finalDescription !== undefined) {
      task.finalDescription = finalDescription;
    } else if (status !== 'completed') {
      task.finalDescription = '';
    }

    await user.save();
    res.json(user.tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/members/:id/tasks/:taskId
// @desc    Delete a task
// @access  Private/Admin
router.delete('/:id/tasks/:taskId', [auth, admin], async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });

    user.tasks.pull({ _id: req.params.taskId });
    await user.save();
    
    res.json(user.tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
