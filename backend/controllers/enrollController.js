const FirestoreService = require('../services/firestoreServices');
const logger = require('../utils/logger');

const enrollmentService = new FirestoreService('enrollments');
const courseService = new FirestoreService('courses');
const userService = new FirestoreService('users');

const enrollController = {
    async enrollStudent(req, res) {
        try {
            const { userId, courseId } = req.body;

            // Verify user exists
            const user = await userService.getById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify course exists
            const course = await courseService.getById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Check if already enrolled
            const existingEnrollments = await enrollmentService.getAll();
            const isEnrolled = existingEnrollments.some(
                enrollment => enrollment.userId === userId && enrollment.courseId === courseId
            );

            if (isEnrolled) {
                return res.status(400).json({
                    success: false,
                    message: 'Student is already enrolled in this course'
                });
            }

            // Create enrollment
            const enrollment = await enrollmentService.create({
                userId,
                courseId,
                status: 'active',
                enrollmentDate: new Date()
            });

            res.status(201).json({
                success: true,
                data: enrollment
            });
        } catch (error) {
            logger.error('Error enrolling student:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to enroll student'
            });
        }
    },

    async unenrollStudent(req, res) {
        try {
            const { enrollmentId } = req.params;
            
            const enrollment = await enrollmentService.getById(enrollmentId);
            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: 'Enrollment not found'
                });
            }

            await enrollmentService.delete(enrollmentId);

            res.json({
                success: true,
                message: 'Student unenrolled successfully'
            });
        } catch (error) {
            logger.error('Error unenrolling student:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unenroll student'
            });
        }
    },

    async getEnrollmentsByUser(req, res) {
        try {
            const { userId } = req.params;
            const enrollments = await enrollmentService.getAll();
            
            const userEnrollments = enrollments.filter(
                enrollment => enrollment.userId === userId
            );

            // Get course details for each enrollment
            const enrollmentsWithCourses = await Promise.all(
                userEnrollments.map(async (enrollment) => {
                    const course = await courseService.getById(enrollment.courseId);
                    return {
                        ...enrollment,
                        course
                    };
                })
            );

            res.json({
                success: true,
                data: enrollmentsWithCourses
            });
        } catch (error) {
            logger.error('Error getting user enrollments:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve enrollments'
            });
        }
    },

    async getEnrollmentsByCourse(req, res) {
        try {
            const { courseId } = req.params;
            const enrollments = await enrollmentService.getAll();
            
            const courseEnrollments = enrollments.filter(
                enrollment => enrollment.courseId === courseId
            );

            // Get user details for each enrollment
            const enrollmentsWithUsers = await Promise.all(
                courseEnrollments.map(async (enrollment) => {
                    const user = await userService.getById(enrollment.userId);
                    return {
                        ...enrollment,
                        user
                    };
                })
            );

            res.json({
                success: true,
                data: enrollmentsWithUsers
            });
        } catch (error) {
            logger.error('Error getting course enrollments:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve enrollments'
            });
        }
    }
};

module.exports = enrollController; 