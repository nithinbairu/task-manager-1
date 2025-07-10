require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task'); 
const mongoose = require('mongoose'); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = "models/gemini-1.5-flash"; 

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
        res.status(500).json({ message: 'AI generation error', error: err.message });
    }
};

exports.predictNextCategoryAI = async (req, res) => {
    const { userId } = req.params; 
    const { newTaskSummary } = req.query; 

    if (!userId || !newTaskSummary) {
        return res.status(400).json({ message: 'User ID and new task summary are required for AI prediction.' });
    }

    try {
        const userIdAsObjectId = new mongoose.Types.ObjectId(userId);
        
        const tasks = await Task.find({ user: userIdAsObjectId }).select('category name').limit(50);

        let prompt = `Given the following past task categories and summaries for a user:\n`;
        tasks.forEach(task => {
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
        res.status(500).json({ message: 'AI Prediction error', error: err.message }); 
    }
};

exports.generateAdminReport = async (req, res) => {
    try {
        const now = new Date();
        const tasks = await Task.find(); 

        const critical = tasks.filter(task => task.priority === 'high'); 
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

        const result = await model.generateContent(reportPrompt); 

        const summary = (await result.response).text();

        res.json({
            summary,
            totalTasks: tasks.length, 
            criticalTasks: critical.length, 
            overdueTasks: overdue.length,   
        });
    } catch (err) {
        console.error('Admin report generation failed:', err);
        res.status(500).json({ message: 'Failed to generate report', error: err.message });
    }
};
