require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task'); 
const mongoose = require('mongoose'); 

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Update to a model that supports generateContent
const MODEL_NAME = "models/gemini-1.5-flash"; // Ensure this model exists and supports your use case

// Generate task description using Google Gemini
exports.generateDescription = async (req, res) => {
    const { summary } = req.body;

    if (!summary) {
        return res.status(400).json({ message: 'Summary is required' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const result = await model.generateContent([
            `Task Summary: ${summary}\nPlease generate a clear and professional task description. and it is in 2 lines`,
        ]);

        const response = await result.response;
        const text = response.text();

        res.json({ description: text });
    } catch (err) {
        console.error('Google AI description generation failed:', err);
        res.status(500).json({ message: 'AI generation error', error: err.message }); // Provide error message
    }
};

// Predict next likely category based on user task history (AI-powered version)
exports.predictNextCategoryAI = async (req, res) => {
    const { userId } = req.params; // Get userId from URL parameters
    const { newTaskSummary } = req.query; // Get newTaskSummary from query parameters

    if (!userId || !newTaskSummary) {
        return res.status(400).json({ message: 'User ID and new task summary are required for AI prediction.' });
    }

    try {
        // Convert userId string from JWT/params to MongoDB ObjectId for querying
        const userIdAsObjectId = new mongoose.Types.ObjectId(userId);
        
        // Fetch recent tasks for the user (limiting to 50 for performance)
        // Changed 'summary' to 'name' based on Task schema 'name' field, assuming name is the summary
        const tasks = await Task.find({ user: userIdAsObjectId }).select('category name').limit(50);

        // Prepare a prompt for Gemini
        let prompt = `Given the following past task categories and summaries for a user:\n`;
        tasks.forEach(task => {
            // Ensure task.category and task.name exist before adding to prompt
            if (task.category && task.name) {
                prompt += `- Category: ${task.category}, Summary: "${task.name}"\n`;
            }
        });
        prompt += `\nBased on this, what is the most likely category for a new task with the summary: "${newTaskSummary}"?\n`;
        prompt += `Please respond with only the category name (e.g., "Work", "Personal", "Shopping", "Learning", etc.) and nothing else. If unsure, suggest "General".`;

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const result = await model.generateContent(prompt);

        const aiPrediction = (await result.response).text().trim();

        res.json({ predictedCategory: aiPrediction });

    } catch (err) {
        console.error('AI Predict category failed:', err);
        res.status(500).json({ message: 'AI Prediction error', error: err.message }); // Provide error message
    }
};

// Generate AI-powered admin report using Gemini
exports.generateAdminReport = async (req, res) => {
    try {
        const now = new Date();
        const tasks = await Task.find(); // Fetches all tasks for admin report

        // Filter critical and overdue tasks
        // Note: You might need to add 'priority' field to Task schema for 'critical' tasks
        const critical = tasks.filter(task => task.priority === 'high'); // Assumes a 'priority' field
        const overdue = tasks.filter(task =>
            new Date(task.dueDate) < now && task.status !== 'completed'
        );

        const reportPrompt = `
            As an AI assistant, generate a concise admin report summary based on:
            - ${tasks.length} total tasks
            - ${critical.length} critical tasks
            - ${overdue.length} overdue tasks
            Include helpful insights and recommend actions.
        `;

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const result = await model.generateContent(reportPrompt); // Direct string prompt is fine

        const summary = (await result.response).text();

        res.json({
            summary,
            totalTasks: tasks.length, // Add totalTasks to response for clarity
            criticalTasks: critical.length, // Add criticalTasks to response for clarity
            overdueTasks: overdue.length,   // Add overdueTasks to response for clarity
        });
    } catch (err) {
        console.error('Admin report generation failed:', err);
        res.status(500).json({ message: 'Failed to generate report', error: err.message });
    }
};
