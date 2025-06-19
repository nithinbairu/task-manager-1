// server/routes/taskRoutes.js
const mongoose = require('mongoose'); // <--- CRITICAL: Make sure this is at the top
const Task = require('../models/Task'); // <--- CRITICAL: Make sure this is at the top
const express = require('express');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

const  auth  = require('../middlewares/auth');
const router = express.Router();


router.use(auth);
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

router.get('/categories', async (req, res) => {
    try {
        // No need to re-import Task or mongoose here if they are at the top
        const userIdAsObjectId = new mongoose.Types.ObjectId(req.user.id);
        const categories = await Task.distinct('category', { user: userIdAsObjectId, category: { $ne: null, $ne: '' } });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching distinct categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
});

module.exports = router;