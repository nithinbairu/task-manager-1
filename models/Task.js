const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: String,
    category: String,
    dueDate: Date,
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
