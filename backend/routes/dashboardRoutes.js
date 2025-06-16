const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const logger = require('../utils/logger');

// Import services
const dashboardService = require('../services/firestore/dashboardService');
const coursesService = require('../services/firestore/courseService');
const modulesService = require('../services/firestore/moduleService');
const lessonsService = require('../services/firestore/lessonService');
const quizzesService = require('../services/firestore/quizServices');

// Import controllers
const userController = require('../controllers/userController');
const courseController = require('../controllers/courseController');
const enrollController = require('../controllers/enrollController');

// ================================
// DASHBOARD & ANALYTICS ROUTES
// ================================

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await dashboardService.getDashboardStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get detailed analytics
router.get('/analytics', async (req, res) => {
    try {
        const analytics = await dashboardService.getAnalytics();
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ================================
// SEARCH ROUTES
// ================================

// Search courses
router.get('/search/courses', [
    param('q').optional().trim(),
    param('category').optional().trim(),
    param('instructor').optional().trim()
], async (req, res) => {
    try {
        const results = await coursesService.searchCourses(req.query);
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Error searching courses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search courses',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Search lessons
router.get('/search/lessons', [
    param('q').optional().trim(),
    param('courseId').optional(),
    param('moduleId').optional()
], async (req, res) => {
    try {
        const results = await lessonsService.searchLessons(req.query);
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Error searching lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search lessons',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;