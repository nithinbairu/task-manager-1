const express = require('express');
const router = express.Router();
const Task = require('../models/Task'); // Make sure this is your Mongoose model

router.get('/', async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });

    const recentTasks = await Task.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        recentTasks
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
