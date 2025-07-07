const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    action: String,
    taskId: mongoose.Schema.Types.ObjectId, 
    userId: mongoose.Schema.Types.ObjectId, 
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Audit', auditSchema);
