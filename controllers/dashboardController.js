// server/controllers/dashboardController.js
const Task = require('../models/Task');
const moment = require('moment');
const mongoose = require('mongoose'); // Import mongoose for ObjectId conversion

/**
 * Fetches overall dashboard statistics for the authenticated user.
 * Includes total, completed, pending, due today, and overdue tasks.
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Convert user ID string from JWT to MongoDB ObjectId for querying
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);
        const now = moment();

        // Count total tasks for the user
        const totalTasks = await Task.countDocuments({ user: userIdAsObjectId });

        // Count completed tasks for the user
        const completedTasks = await Task.countDocuments({ user: userIdAsObjectId, status: 'completed' });

        // Count pending tasks for the user
        const pendingTasks = await Task.countDocuments({ user: userIdAsObjectId, status: 'pending' });

        // Count tasks due today that are still pending
        const dueTodayTasks = await Task.countDocuments({
            user: userIdAsObjectId,
            status: 'pending',
            dueDate: {
                $gte: now.startOf('day').toDate(),
                $lte: now.endOf('day').toDate(),
            },
        });

        // Count overdue tasks that are still pending
        const overdueTasks = await Task.countDocuments({
            user: userIdAsObjectId,
            status: 'pending',
            dueDate: { $lt: now.startOf('day').toDate() }, // Due date is before the start of today
        });

        // Calculate completion rate, handling division by zero
        const completionRate = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

        // Send the aggregated statistics as JSON response
        res.json({
            totalTasks,
            completedTasks,
            completionRate: parseFloat(completionRate.toFixed(2)), // Format to 2 decimal places
            dueTodayTasks,
            overdueTasks,
        });
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

/**
 * Fetches counts of completed tasks per day for the last 7 days for charting.
 */
exports.getTasksByDate = async (req, res) => {
    try {
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);
        const sevenDaysAgo = moment().subtract(6, 'days').startOf('day');

        const dailyCounts = await Task.aggregate([
            {
                $match: {
                    user: userIdAsObjectId,
                    status: 'completed',
                    completedAt: { $gte: sevenDaysAgo.toDate() }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const labels = [];
        const data = [];

        for (let i = 0; i < 7; i++) {
            const date = moment().subtract(6 - i, 'days');
            labels.push(date.format('ddd'));
            const targetDateStr = date.format('YYYY-MM-DD');
            const found = dailyCounts.find(item => item._id === targetDateStr);
            data.push(found ? found.count : 0);
        }

        res.json({ labels, data });
    } catch (error) {
        console.error("Error in getTasksByDate (Tasks Completed Last 7 Days):", error);
        res.status(500).json({ message: "Server error fetching tasks by date" });
    }
};

/**
 * Fetches the distribution of tasks across different categories for charting.
 */
exports.getTaskCategoryDistribution = async (req, res) => {
    try {
        // Convert user ID string from JWT to MongoDB ObjectId
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);

        // Aggregate tasks by category
        const categoryCounts = await Task.aggregate([
            { $match: { user: userIdAsObjectId } }, // Match by correct user field
            { $group: {
                _id: "$category", // Group by category field
                count: { $sum: 1 } // Count tasks per category
            }},
            { $project: {
                _id: 0, // Exclude _id from output
                label: "$_id", // Rename _id to label for chart compatibility
                data: "$count" // Rename count to data for chart compatibility
            }}
        ]);

        // Extract labels and data arrays for the chart
        const labels = categoryCounts.map(item => item.label);
        const data = categoryCounts.map(item => item.data);

        res.json({ labels, data });
    } catch (error) {
        console.error("Error in getTaskCategoryDistribution:", error);
        res.status(500).json({ message: "Server error fetching category distribution" });
    }
};

/**
 * Fetches tasks that are due today and are still pending.
 */
exports.getTasksDueToday = async (req, res) => {
    try {
        // Convert user ID string from JWT to MongoDB ObjectId
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);
        const now = moment();

        // Find pending tasks due today for the user
        const tasks = await Task.find({
            user: userIdAsObjectId, // Match by correct user field
            status: 'pending',
            dueDate: {
                $gte: now.startOf('day').toDate(), // From start of today
                $lte: now.endOf('day').toDate(),   // To end of today
            },
        }).sort({ dueDate: 1 }); // Sort by due date ascending

        res.json(tasks);
    } catch (error) {
        console.error("Error in getTasksDueToday:", error);
        res.status(500).json({ message: "Server error fetching tasks due today" });
    }
};

/**
 * Fetches a limited number of the most recently created or updated tasks.
 */
exports.getRecentTasks = async (req, res) => {
    try {
        // Convert user ID string from JWT to MongoDB ObjectId
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);
        
        // Find tasks for the user, sort by latest update/creation, and limit to 5
        const recentTasks = await Task.find({ user: userIdAsObjectId }) // Match by correct user field
                                     .sort({ updatedAt: -1, createdAt: -1 }) // Sort by most recent update, then creation
                                     .limit(5); // Limit to 5 tasks

        res.json(recentTasks);
    } catch (error) {
        console.error("Error in getRecentTasks:", error);
        res.status(500).json({ message: "Server error fetching recent tasks" });
    }
};
