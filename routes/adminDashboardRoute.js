const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/adminDashboardController');
// Optionally use verifyAdmin middleware

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};


router.get('/dashboard', getAdminDashboard);
module.exports = router;