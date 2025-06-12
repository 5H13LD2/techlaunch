const express = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const userController = require('../controllers/userController');
const courseController = require('../controllers/courseController');
const enrollController = require('../controllers/enrollController');
const { validateEmailParam, validateCourseNameParam } = require('../middleware/validateRequest');

const router = express.Router();

// User routes
router.post('/users', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['student', 'admin']).withMessage('Role must be either student or admin')
], validateRequest, userController.createUser);

router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.get('/users/:email', validateEmailParam, userController.getUserByEmail);
router.get('/users/:email/courses', validateEmailParam, userController.getUserCourses);
router.get('/users/stats', userController.getUserStats);

// Course routes
router.post('/courses', [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('instructor').trim().notEmpty().withMessage('Instructor is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
], validateRequest, courseController.createCourse);

router.get('/courses', courseController.getAllCourses);
router.get('/courses/:id', courseController.getCourseById);
router.put('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);
router.get('/courses/:name', validateCourseNameParam, courseController.getCourseByName);
router.post('/courses/:courseId/modules', courseController.addModule);

// Enrollment routes
router.post('/enrollments', [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('courseId').notEmpty().withMessage('Course ID is required')
], validateRequest, enrollController.enrollStudent);

router.delete('/enrollments/:enrollmentId', enrollController.unenrollStudent);
router.get('/users/:userId/enrollments', enrollController.getEnrollmentsByUser);
router.get('/courses/:courseId/enrollments', enrollController.getEnrollmentsByCourse);
router.post('/enroll', validateRequest('enrollUser'), enrollController.enrollUser);
router.get('/enrollments/stats', enrollController.getEnrollmentStats);

// Dashboard routes
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [userStats, courseStats, enrollmentStats] = await Promise.all([
      userController.getUserStats(),
      courseController.getCourseStats(),
      enrollController.getEnrollmentStats()
    ]);

    res.json({
      success: true,
      data: {
        users: userStats,
        courses: courseStats,
        enrollments: enrollmentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 