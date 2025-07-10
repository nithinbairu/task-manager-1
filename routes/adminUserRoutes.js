const express = require('express');
const router = express.Router();
const { createUser, deactivateUser } = require('../controllers/adminUserController');

// POST /api/admin/users
router.post('/users', createUser);

// PATCH /api/admin/users/:userId/deactivate
router.patch('/users/:userId/deactivate', deactivateUser);

module.exports = router;
