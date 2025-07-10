const Task = require('../models/Task');
const moment = require('moment');
const mongoose = require('mongoose'); 

exports.getDashboardStats = async (req, res) => {
    try {
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);
        const now = moment();

        const totalTasks = await Task.countDocuments({ user: userIdAsObjectId });

        const completedTasks = await Task.countDocuments({ user: userIdAsObjectId, status: 'completed' });

        const pendingTasks = await Task.countDocuments({ user: userIdAsObjectId, status: 'pending' });

        const dueTodayTasks = await Task.countDocuments({
            user: userIdAsObjectId,
            status: 'pending',
            dueDate: {
                $gte: now.startOf('day').toDate(),
                $lte: now.endOf('day').toDate(),
            },
        });

        const overdueTasks = await Task.countDocuments({
            user: userIdAsObjectId,
            status: 'pending',
            dueDate: { $lt: now.startOf('day').toDate() },
        });

        const completionRate = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

        res.json({
            totalTasks,
            completedTasks,
            completionRate: parseFloat(completionRate.toFixed(2)), 
            dueTodayTasks,
            overdueTasks,
        });
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};


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


exports.getTaskCategoryDistribution = async (req, res) => {
    try {
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);

        const categoryCounts = await Task.aggregate([
            { $match: { user: userIdAsObjectId } }, 
            { $group: {
                _id: "$category", 
                count: { $sum: 1 } 
            }},
            { $project: {
                _id: 0, 
                label: "$_id", 
                data: "$count" 
            }}
        ]);

        const labels = categoryCounts.map(item => item.label);
        const data = categoryCounts.map(item => item.data);

        res.json({ labels, data });
    } catch (error) {
        console.error("Error in getTaskCategoryDistribution:", error);
        res.status(500).json({ message: "Server error fetching category distribution" });
    }
};


exports.getTasksDueToday = async (req, res) => {
    try {
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);
        const now = moment();

        const tasks = await Task.find({
            user: userIdAsObjectId, 
            status: 'pending',
            dueDate: {
                $gte: now.startOf('day').toDate(), 
                $lte: now.endOf('day').toDate(),   
            },
        }).sort({ dueDate: 1 });

        res.json(tasks);
    } catch (error) {
        console.error("Error in getTasksDueToday:", error);
        res.status(500).json({ message: "Server error fetching tasks due today" });
    }
};


exports.getRecentTasks = async (req, res) => {
    try {
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);
        
        const recentTasks = await Task.find({ user: userIdAsObjectId }) 
                                     .sort({ updatedAt: -1, createdAt: -1 }) 
                                     .limit(5); // Limit to 5 tasks

        res.json(recentTasks);
    } catch (error) {
        console.error("Error in getRecentTasks:", error);
        res.status(500).json({ message: "Server error fetching recent tasks" });
    }
};
