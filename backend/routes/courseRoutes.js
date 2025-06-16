const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const courseService = require('../services/firestore/courseService');

// ================================
// COURSE ROUTES
// ================================

// Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await courseService.getAllCourses();
        res.json({
            success: true,
            data: courses,
            count: courses.length
        });
    } catch (error) {
        logger.error('❌ Error getting courses:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve courses'
        });
    }
});

// Get course by ID
router.get('/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await courseService.getCourseById(courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        logger.error('❌ Error getting course:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve course'
        });
    }
});

// Create new course
router.post('/', async (req, res) => {
    try {
        const { courseName, description, status = 'active' } = req.body;
        
        // Validate required fields
        const missingFields = ['courseName', 'description'].filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                error: 'Validation failed'
            });
        }
        
        const newCourse = await courseService.createCourse({
            courseName: courseName.trim(),
            description: description.trim(),
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: newCourse
        });
    } catch (error) {
        logger.error('❌ Error creating course:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Course creation failed'
        });
    }
});

// Update course
router.put('/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const updateData = {
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        const updatedCourse = await courseService.updateCourse(courseId, updateData);
        
        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: updatedCourse
        });
    } catch (error) {
        logger.error('❌ Error updating course:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to update course'
        });
    }
});

// Delete course
router.delete('/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        await courseService.deleteCourse(courseId);
        
        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        logger.error('❌ Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to delete course'
        });
    }
});

// Get course modules
router.get('/:courseId/modules', async (req, res) => {
    try {
        const { courseId } = req.params;
        const modules = await courseService.getCourseModules(courseId);
        
        res.json({
            success: true,
            data: modules
        });
    } catch (error) {
        logger.error('❌ Error getting course modules:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve course modules'
        });
    }
});

// Get specific module in a course
router.get('/:courseId/modules/:moduleId', async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const module = await courseService.getModuleById(courseId, moduleId);
        
        if (!module) {
            return res.status(404).json({
                success: false,
                message: 'Module not found'
            });
        }

        res.json({
            success: true,
            data: module
        });
    } catch (error) {
        logger.error('❌ Error getting module:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve module'
        });
    }
});

// Get course enrollments
router.get('/:courseId/enrollments', async (req, res) => {
    try {
        const { courseId } = req.params;
        const enrollments = await courseService.getCourseEnrollments(courseId);
        
        res.json({
            success: true,
            data: enrollments
        });
    } catch (error) {
        logger.error('❌ Error getting course enrollments:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve course enrollments'
        });
    }
});

module.exports = router;
