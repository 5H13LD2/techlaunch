const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const FirestoreServices = require('../services/firestore/enrollmentService');

// Get all enrollments
router.get('/', async (req, res) => {
    try {
        const enrollments = await FirestoreServices.getAllEnrollments();
        logger.info('Retrieved all enrollments');
        res.json({ success: true, data: enrollments });
    } catch (error) {
        logger.error('Error retrieving enrollments:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get enrollment by ID
router.get('/:enrollmentId', async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const enrollment = await FirestoreServices.getEnrollmentById(enrollmentId);
        
        if (!enrollment) {
            logger.warn(`Enrollment not found: ${enrollmentId}`);
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        logger.info(`Retrieved enrollment: ${enrollmentId}`);
        res.json({ success: true, data: enrollment });
    } catch (error) {
        logger.error(`Error retrieving enrollment ${req.params.enrollmentId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new enrollment
router.post('/', async (req, res) => {
    try {
        const { userId, courseId, status = 'active' } = req.body;

        // Validate required fields
        if (!userId || !courseId) {
            logger.warn('Missing required fields for enrollment creation');
            return res.status(400).json({ 
                success: false, 
                message: 'userId and courseId are required' 
            });
        }

        const enrollmentData = {
            userId,
            courseId,
            status,
            enrolledAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString()
        };

        const enrollment = await FirestoreServices.createEnrollment(enrollmentData);
        logger.info(`Created new enrollment for user ${userId} in course ${courseId}`);
        res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
        logger.error('Error creating enrollment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update enrollment status
router.put('/:enrollmentId', async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { status } = req.body;

        if (!status) {
            logger.warn('Missing status field for enrollment update');
            return res.status(400).json({ 
                success: false, 
                message: 'status is required' 
            });
        }

        const updateData = {
            status,
            lastAccessed: new Date().toISOString()
        };

        const enrollment = await FirestoreServices.updateEnrollment(enrollmentId, updateData);
        
        if (!enrollment) {
            logger.warn(`Enrollment not found for update: ${enrollmentId}`);
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        logger.info(`Updated enrollment ${enrollmentId} status to ${status}`);
        res.json({ success: true, data: enrollment });
    } catch (error) {
        logger.error(`Error updating enrollment ${req.params.enrollmentId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete enrollment
router.delete('/:enrollmentId', async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const result = await FirestoreServices.deleteEnrollment(enrollmentId);
        
        if (!result) {
            logger.warn(`Enrollment not found for deletion: ${enrollmentId}`);
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        logger.info(`Deleted enrollment: ${enrollmentId}`);
        res.json({ success: true, message: 'Enrollment deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting enrollment ${req.params.enrollmentId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get enrollments by user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const enrollments = await FirestoreServices.getUserEnrollments(userId);
        logger.info(`Retrieved enrollments for user ${userId}`);
        res.json({ success: true, data: enrollments });
    } catch (error) {
        logger.error(`Error retrieving enrollments for user ${req.params.userId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get enrollments by course
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const enrollments = await FirestoreServices.getCourseEnrollments(courseId);
        logger.info(`Retrieved enrollments for course ${courseId}`);
        res.json({ success: true, data: enrollments });
    } catch (error) {
        logger.error(`Error retrieving enrollments for course ${req.params.courseId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;