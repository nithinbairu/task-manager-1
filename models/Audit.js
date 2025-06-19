const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    action: String,
    taskId: mongoose.Schema.Types.ObjectId, // References the Task model
    userId: mongoose.Schema.Types.ObjectId, // References the User model
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Audit', auditSchema);
