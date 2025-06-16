// ================================
// 3. routes/quizRoutes.js
// ================================

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const quizService = require('../services/firestore/quizServices');

// Get all quizzes
router.get('/', async (req, res) => {
    try {
        const quizzes = await quizService.getAllQuizzes();
        logger.info('Retrieved all quizzes');
        res.json({ success: true, data: quizzes });
    } catch (error) {
        logger.error('Error retrieving quizzes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get quiz by ID
router.get('/:quizId', async (req, res) => {
    try {
        const { quizId } = req.params;
        const quiz = await quizService.getQuizById(quizId);
        
        if (!quiz) {
            logger.warn(`Quiz not found: ${quizId}`);
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        logger.info(`Retrieved quiz: ${quizId}`);
        res.json({ success: true, data: quiz });
    } catch (error) {
        logger.error(`Error retrieving quiz ${req.params.quizId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new quiz
router.post('/', async (req, res) => {
    try {
        const { title, description, questions, courseId, moduleId, lessonId, timeLimit, passingScore } = req.body;

        // Validate required fields
        if (!title || !questions || !courseId || !moduleId || !lessonId) {
            logger.warn('Missing required fields for quiz creation');
            return res.status(400).json({ 
                success: false, 
                message: 'title, questions, courseId, moduleId, and lessonId are required' 
            });
        }

        const quizData = {
            title,
            description,
            questions,
            courseId,
            moduleId,
            lessonId,
            timeLimit: timeLimit || 30, // Default 30 minutes
            passingScore: passingScore || 70, // Default 70%
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };

        const quiz = await quizService.createQuiz(quizData);
        logger.info(`Created new quiz: ${quiz.id}`);
        res.status(201).json({ success: true, data: quiz });
    } catch (error) {
        logger.error('Error creating quiz:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update quiz
router.put('/:quizId', async (req, res) => {
    try {
        const { quizId } = req.params;
        const updateData = {
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        const quiz = await quizService.updateQuiz(quizId, updateData);
        
        if (!quiz) {
            logger.warn(`Quiz not found for update: ${quizId}`);
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        logger.info(`Updated quiz: ${quizId}`);
        res.json({ success: true, data: quiz });
    } catch (error) {
        logger.error(`Error updating quiz ${req.params.quizId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete quiz
router.delete('/:quizId', async (req, res) => {
    try {
        const { quizId } = req.params;
        const result = await quizService.deleteQuiz(quizId);
        
        if (!result) {
            logger.warn(`Quiz not found for deletion: ${quizId}`);
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        logger.info(`Deleted quiz: ${quizId}`);
        res.json({ success: true, message: 'Quiz deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting quiz ${req.params.quizId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get quizzes by lesson
router.get('/lesson/:lessonId', async (req, res) => {
    try {
        const { lessonId } = req.params;
        const quizzes = await quizService.getQuizzesByLesson(lessonId);
        logger.info(`Retrieved quizzes for lesson ${lessonId}`);
        res.json({ success: true, data: quizzes });
    } catch (error) {
        logger.error(`Error retrieving quizzes for lesson ${req.params.lessonId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Submit quiz attempt
router.post('/:quizId/attempt', async (req, res) => {
    try {
        const { quizId } = req.params;
        const { userId, answers, timeSpent } = req.body;

        if (!userId || !answers) {
            logger.warn('Missing required fields for quiz attempt');
            return res.status(400).json({ 
                success: false, 
                message: 'userId and answers are required' 
            });
        }

        const attemptData = {
            userId,
            answers,
            timeSpent
        };

        const result = await quizService.submitQuizAttempt(quizId, attemptData);
        logger.info(`Submitted quiz attempt for quiz ${quizId} by user ${userId}`);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        logger.error(`Error submitting quiz attempt for quiz ${req.params.quizId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get quiz attempts by user
router.get('/user/:userId/attempts', async (req, res) => {
    try {
        const { userId } = req.params;
        const { quizId } = req.query;
        
        let attempts;
        if (quizId) {
            attempts = await quizService.getQuizAttempts(quizId, userId);
        } else {
            attempts = await quizService.getAllQuizAttempts(userId);
        }
        
        logger.info(`Retrieved quiz attempts for user ${userId}`);
        res.json({ success: true, data: attempts });
    } catch (error) {
        logger.error(`Error retrieving quiz attempts for user ${req.params.userId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;