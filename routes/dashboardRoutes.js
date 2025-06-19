// server/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const auth  = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboardController');

// Add these logs
console.log("\n--- dashboardRoutes.js Load Check ---");
console.log("Type of auth:", typeof auth);
console.log("dashboardController object keys:", Object.keys(dashboardController)); // Check what's exported
console.log("Type of dashboardController.getDashboardStats:", typeof dashboardController.getDashboardStats);
console.log("Type of dashboardController.getTasksByDate:", typeof dashboardController.getTasksByDate);
console.log("--- End dashboardRoutes.js Load Check ---\n");

router.use(auth); // Apply auth middleware to all routes defined in this router

router.get('/stats', dashboardController.getDashboardStats);
router.get('/tasks-completed-7-days', dashboardController.getTasksByDate);
router.get('/category-distribution', dashboardController.getTaskCategoryDistribution);
router.get('/recent-tasks', dashboardController.getRecentTasks);
router.get('/tasks-by-date', dashboardController.getTasksByDate);
// You might also need a route for 'tasks due today' if not covered by getTasks general filtering
// router.get('/tasks-due-today', dashboardController.getTasksDueToday); // if you add this controller function

module.exports = router;