const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;
        },
    },
    role: {
        type: String,
        default: 'user',
    },
    googleId: String, // optional
});

module.exports = mongoose.model('User', userSchema);
