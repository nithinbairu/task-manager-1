const User = require('../models/User');
const Task = require('../models/Task');
const dayjs = require('dayjs'); 

const getAdminDashboard = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('_id name email');

    const today = dayjs();
    const twoDaysFromNow = today.add(2, 'day');

    const dashboardData = await Promise.all(users.map(async (user) => {
      const tasks = await Task.find({ user: user._id });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const pendingTasks = tasks.filter(task => task.status === 'pending').length;
      const overdueTasks = tasks.filter(task =>
        task.status === 'pending' && task.dueDate && dayjs(task.dueDate).isBefore(today)
      ).length;

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks
      };
    }));

    // Critical tasks = due in next 2 days
    const criticalTasks = await Task.find({
      dueDate: { $lte: twoDaysFromNow.toDate(), $gte: today.toDate() },
      status: 'pending'
    }).populate('user', 'name email');

    // Overdue tasks = due date in past & not completed
    const overdueTasks = await Task.find({
      dueDate: { $lt: today.toDate() },
      status: 'pending'
    }).populate('user', 'name email');

    res.status(200).json({
      usersSummary: dashboardData,
      report: {
        criticalTasks,
        overdueTasks
      }
    });

  } catch (err) {
    console.error('Error fetching dashboard:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAdminDashboard,
};
