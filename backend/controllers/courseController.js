const FirestoreService = require('../services/firestoreServices');
const logger = require('../utils/logger');

const courseService = new FirestoreService('courses');

const courseController = {
    async createCourse(req, res) {
        try {
            const courseData = req.body;
            const course = await courseService.create({
                ...courseData,
                enrolledStudents: [],
                status: 'active'
            });
            
            res.status(201).json({
                success: true,
                data: course
            });
        } catch (error) {
            logger.error('Error creating course:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create course'
            });
        }
    },

    async getAllCourses(req, res) {
        try {
            const courses = await courseService.getAll();
            res.json({
                success: true,
                data: courses
            });
        } catch (error) {
            logger.error('Error getting courses:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve courses'
            });
        }
    },

    async getCourseById(req, res) {
        try {
            const { id } = req.params;
            const course = await courseService.getById(id);
            
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
            logger.error('Error getting course:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve course'
            });
        }
    },

    async updateCourse(req, res) {
        try {
            const { id } = req.params;
            const courseData = req.body;
            const course = await courseService.update(id, courseData);
            
            res.json({
                success: true,
                data: course
            });
        } catch (error) {
            logger.error('Error updating course:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update course'
            });
        }
    },

    async deleteCourse(req, res) {
        try {
            const { id } = req.params;
            await courseService.delete(id);
            
            res.json({
                success: true,
                message: 'Course deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting course:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete course'
            });
        }
    }
};

module.exports = courseController; 