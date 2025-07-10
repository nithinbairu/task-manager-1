const Task = require('../models/Task');
const Audit = require('../models/Audit');
const mongoose = require('mongoose'); 
const moment = require('moment'); 

exports.updateTask = async (req, res) => {
    try {
        const userIdFromToken = new mongoose.Types.ObjectId(req.user.id);
        const { id } = req.params;
        let updates = req.body; 

        const existingTask = await Task.findOne({ _id: id, user: userIdFromToken });

        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }

        if (updates.status === 'completed' && existingTask.status !== 'completed') {
            updates.completedAt = moment().toDate(); 
            console.log(`[TaskController] updateTask: Task ${id} marked completed. Setting completedAt: ${updates.completedAt}`);
        }
        else if (updates.status === 'pending' && existingTask.status === 'completed') {
            updates.completedAt = null;
            console.log(`[TaskController] updateTask: Task ${id} changed to pending. Clearing completedAt.`);
        }
        else if (updates.status === 'completed' && !existingTask.completedAt) {
            updates.completedAt = moment().toDate();
            console.log(`[TaskController] updateTask: Task ${id} was completed but missing completedAt. Setting it now: ${updates.completedAt}`);
        }

        const updatedTask = await Task.findOneAndUpdate(
            { _id: id, user: userIdFromToken }, 
            updates, 
            { new: true } 
        );

        await Audit.create({ action: 'UPDATE', taskId: updatedTask._id, userId: req.user.id });
        res.json(updatedTask);
    } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ message: 'Server error updating task' }); 
    }
};


exports.getTasks = async (req, res) => {
    try {
        const userIdFromToken = new mongoose.Types.ObjectId(req.user.id); 
        const { search, status, category, dueDate } = req.query; 
        let query = { user: userIdFromToken }; 
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, 
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (category && category !== 'all') { 
            query.category = category;
        }

        if (dueDate) {
            const now = moment();
            if (dueDate === 'today') {
                query.dueDate = {
                    $gte: now.startOf('day').toDate(),
                    $lte: now.endOf('day').toDate(),
                };
                query.status = 'pending'; 
            } else if (dueDate === 'upcoming') {
                query.dueDate = {
                    $gte: now.endOf('day').toDate(), 
                };
                query.status = 'pending';
            } else if (dueDate === 'overdue') {
                query.dueDate = {
                    $lt: now.startOf('day').toDate(), 
                };
                query.status = 'pending'; 
            }
        }

        const tasks = await Task.find(query).sort({ createdAt: -1 }); 
        res.json(tasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createTask = async (req, res) => {
  try {
    const userIdFromToken = new mongoose.Types.ObjectId(req.user.id); // New variable
    const { name, description, category, dueDate } = req.body;
    const newTask = new Task({
      name,
      description,
      category,
      dueDate,
      user: userIdFromToken, // *** CHANGE 'userId' to 'user' HERE ***
    });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error("Error creating task:", err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const userIdFromToken = new mongoose.Types.ObjectId(req.user.id);
    const { id } = req.params;
    let updates = { ...req.body }; // Copy to modify if needed

    // Find the existing task for this user
    const existingTask = await Task.findOne({ _id: id, user: userIdFromToken });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    // Handle completedAt timestamp logic
    if (updates.status === 'completed' && existingTask.status !== 'completed') {
      // Task is newly marked completed — set completedAt to now
      updates.completedAt = moment().toDate();
      console.log(`[TaskController] updateTask: Task ${id} status changed to completed. Setting completedAt: ${updates.completedAt}`);
    } else if (updates.status === 'pending' && existingTask.status === 'completed') {
      // Task is moved back to pending — clear completedAt
      updates.completedAt = null;
      console.log(`[TaskController] updateTask: Task ${id} status changed to pending. Clearing completedAt.`);
    } else if (updates.status === 'completed' && !existingTask.completedAt) {
      // Task is completed but missing completedAt (legacy data) — set it now
      updates.completedAt = moment().toDate();
      console.log(`[TaskController] updateTask: Task ${id} completed but missing completedAt. Setting now: ${updates.completedAt}`);
    }
    // Otherwise leave completedAt unchanged

    // Update the task and return the new document, run validators
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: userIdFromToken },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found or unauthorized after update' });
    }

    // Log audit for update action
    await Audit.create({
      action: 'UPDATE',
      taskId: updatedTask._id,
      userId: req.user.id
    });

    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: 'Server error updating task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const userIdFromToken = new mongoose.Types.ObjectId(req.user.id); // New variable
    const { id } = req.params;
    const deletedTask = await Task.findOneAndDelete({ _id: id, user: userIdFromToken }); // *** CHANGE 'userId' to 'user' HERE ***
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const userIdFromToken = new mongoose.Types.ObjectId(req.user.id); // New variable
    // Aggregate to get distinct categories for the user
    const categories = await Task.aggregate([
      { $match: { user: userIdFromToken } }, // *** CHANGE 'userId' to 'user' HERE ***
      { $group: { _id: "$category" } },
      { $project: { _id: 0, category: "$_id" } }
    ]);
    res.json(categories.map(c => c.category).filter(Boolean)); // Filter out null/undefined categories
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ... (Self-check exports at the end)