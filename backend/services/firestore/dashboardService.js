const { initializeFirebase, admin } = require('../../config/firebase-config');
const logger = require('../../utils/logger');

// Initialize Firebase and get db instance
const db = initializeFirebase();

// Import other services for aggregated data
const userService = require('./userService');
const courseService = require('./courseService');
const moduleService = require('./moduleService');
const LessonsService = require('./lessonService');
const quizService = require('./quizServices');
const enrollmentService = require('./enrollmentService');

// Create instance of LessonsService
const lessonService = new LessonsService();

class DashboardService {
    constructor() {
        this.db = db;
        this.admin = admin;
        this.logger = logger.child({ service: 'DashboardService' });
    }

    // Get overall dashboard statistics
    async getDashboardStats() {
        try {
            const [users, courses, modules, lessons, quizzes, enrollments] = await Promise.all([
                userService.getAllUsers(),
                courseService.getAllCourses(),
                moduleService.getAllModules(),
                lessonService.getAllLessons(),
                quizService.getAllQuizzes(),
                enrollmentService.getAll()
            ]);

            return {
                users: {
                    total: users.length,
                    active: users.filter(user => user.isActive !== false).length
                },
                courses: {
                    total: courses.length,
                    published: courses.filter(course => course.isPublished === true).length
                },
                modules: {
                    total: modules.length
                },
                lessons: {
                    total: lessons.length
                },
                quizzes: {
                    total: quizzes.length,
                    active: quizzes.filter(quiz => quiz.isActive !== false).length
                },
                enrollments: {
                    total: enrollments.length,
                    active: enrollments.filter(enrollment => enrollment.status === 'active').length
                }
            };
        } catch (error) {
            this.logger.error('Error getting dashboard stats:', error);
            throw error;
        }
    }

    // Get detailed analytics
    async getAnalytics() {
        try {
            const [courseAnalytics, moduleAnalytics, lessonAnalytics, quizAnalytics] = await Promise.all([
                this.getCourseAnalytics(),
                this.getModuleAnalytics(),
                this.getLessonAnalytics(),
                this.getQuizAnalytics()
            ]);

            return {
                courses: courseAnalytics,
                modules: moduleAnalytics,
                lessons: lessonAnalytics,
                quizzes: quizAnalytics
            };
        } catch (error) {
            this.logger.error('Error getting analytics:', error);
            throw new Error('Failed to retrieve analytics');
        }
    }

    // Get course analytics
    async getCourseAnalytics() {
        try {
            const courses = await courseService.getAll();
            const enrollments = await enrollmentService.getAll();

            const courseStats = courses.map(course => {
                const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
                return {
                    id: course.id,
                    title: course.title,
                    enrollmentCount: courseEnrollments.length,
                    completionRate: this.calculateCompletionRate(courseEnrollments),
                    averageRating: course.averageRating || 0
                };
            });

            return {
                totalCourses: courses.length,
                publishedCourses: courses.filter(c => c.isPublished).length,
                totalEnrollments: enrollments.length,
                courseStats
            };
        } catch (error) {
            this.logger.error('Error getting course analytics:', error);
            throw new Error('Failed to retrieve course analytics');
        }
    }

    // Get module analytics
    async getModuleAnalytics() {
        try {
            const modules = await moduleService.getAll();
            const lessons = await lessonService.getAll();

            const moduleStats = modules.map(module => {
                const moduleLessons = lessons.filter(l => l.moduleId === module.id);
                return {
                    id: module.id,
                    title: module.title,
                    lessonCount: moduleLessons.length,
                    averageCompletionTime: this.calculateAverageCompletionTime(moduleLessons)
                };
            });

            return {
                totalModules: modules.length,
                averageLessonsPerModule: lessons.length / modules.length,
                moduleStats
            };
        } catch (error) {
            this.logger.error('Error getting module analytics:', error);
            throw new Error('Failed to retrieve module analytics');
        }
    }

    // Get lesson analytics
    async getLessonAnalytics() {
        try {
            const lessons = await lessonService.getAll();
            const quizzes = await quizService.getAllQuizzes();

            const lessonStats = lessons.map(lesson => {
                const lessonQuizzes = quizzes.filter(q => q.lessonId === lesson.id);
                return {
                    id: lesson.id,
                    title: lesson.title,
                    quizCount: lessonQuizzes.length,
                    averageQuizScore: this.calculateAverageQuizScore(lessonQuizzes)
                };
            });

            return {
                totalLessons: lessons.length,
                lessonsWithQuizzes: lessons.filter(l => quizzes.some(q => q.lessonId === l.id)).length,
                lessonStats
            };
        } catch (error) {
            this.logger.error('Error getting lesson analytics:', error);
            throw new Error('Failed to retrieve lesson analytics');
        }
    }

    // Get quiz analytics
    async getQuizAnalytics() {
        try {
            const quizzes = await quizService.getAllQuizzes();
            const attempts = await quizService.getAllQuizAttempts();

            const quizStats = quizzes.map(quiz => {
                const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
                return {
                    id: quiz.id,
                    title: quiz.title,
                    attemptCount: quizAttempts.length,
                    averageScore: this.calculateAverageScore(quizAttempts),
                    passRate: this.calculatePassRate(quizAttempts, quiz.passingScore)
                };
            });

            return {
                totalQuizzes: quizzes.length,
                totalAttempts: attempts.length,
                quizStats
            };
        } catch (error) {
            this.logger.error('Error getting quiz analytics:', error);
            throw new Error('Failed to retrieve quiz analytics');
        }
    }

    // Helper methods
    calculateCompletionRate(enrollments) {
        if (!enrollments.length) return 0;
        const completed = enrollments.filter(e => e.status === 'completed').length;
        return (completed / enrollments.length) * 100;
    }

    calculateAverageCompletionTime(lessons) {
        if (!lessons.length) return 0;
        const totalTime = lessons.reduce((sum, lesson) => sum + (lesson.averageCompletionTime || 0), 0);
        return totalTime / lessons.length;
    }

    calculateAverageQuizScore(quizzes) {
        if (!quizzes.length) return 0;
        const totalScore = quizzes.reduce((sum, quiz) => sum + (quiz.averageScore || 0), 0);
        return totalScore / quizzes.length;
    }

    calculateAverageScore(attempts) {
        if (!attempts.length) return 0;
        const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
        return totalScore / attempts.length;
    }

    calculatePassRate(attempts, passingScore) {
        if (!attempts.length) return 0;
        const passed = attempts.filter(attempt => attempt.score >= passingScore).length;
        return (passed / attempts.length) * 100;
    }
}

module.exports = new DashboardService();
