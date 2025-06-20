const dashboardService = require('../services/firestore/dashboardService');
const logger = require('../utils/logger');

class DashboardController {
    constructor() {
        this.logger = logger.child({ controller: 'DashboardController' });
    }

    // Get main dashboard statistics
    async getDashboardOverview(req, res) {
        try {
            this.logger.info('Fetching dashboard overview');
            
            const stats = await dashboardService.getDashboardStats();
            
            return res.status(200).json({
                success: true,
                message: 'Dashboard overview retrieved successfully',
                data: {
                    overview: {
                        totalUsers: stats.users.total,
                        activeUsers: stats.users.active,
                        totalCourses: stats.courses.total,
                        publishedCourses: stats.courses.published,
                        totalEnrollments: stats.enrollments.total,
                        activeEnrollments: stats.enrollments.active,
                        totalLessons: stats.lessons.total,
                        totalQuizzes: stats.quizzes.total,
                        activeQuizzes: stats.quizzes.active
                    },
                    summary: {
                        userEngagement: ((stats.users.active / stats.users.total) * 100).toFixed(1),
                        coursePublishRate: ((stats.courses.published / stats.courses.total) * 100).toFixed(1),
                        enrollmentRate: ((stats.enrollments.active / stats.enrollments.total) * 100).toFixed(1),
                        averageLessonsPerCourse: (stats.lessons.total / stats.courses.total).toFixed(1),
                        averageQuizzesPerCourse: (stats.quizzes.total / stats.courses.total).toFixed(1)
                    }
                }
            });
        } catch (error) {
            this.logger.error('Error fetching dashboard overview:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve dashboard overview',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get detailed analytics for charts and graphs
    async getDashboardAnalytics(req, res) {
        try {
            this.logger.info('Fetching dashboard analytics');
            
            const analytics = await dashboardService.getAnalytics();
            
            return res.status(200).json({
                success: true,
                message: 'Dashboard analytics retrieved successfully',
                data: analytics
            });
        } catch (error) {
            this.logger.error('Error fetching dashboard analytics:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve dashboard analytics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get course performance metrics
    async getCourseMetrics(req, res) {
        try {
            this.logger.info('Fetching course metrics');
            
            const courseAnalytics = await dashboardService.getCourseAnalytics();
            
            // Sort courses by enrollment count for top performers
            const topCourses = courseAnalytics.courseStats
                .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
                .slice(0, 10);

            // Get courses with highest completion rates
            const highCompletionCourses = courseAnalytics.courseStats
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 5);

            return res.status(200).json({
                success: true,
                message: 'Course metrics retrieved successfully',
                data: {
                    summary: {
                        totalCourses: courseAnalytics.totalCourses,
                        publishedCourses: courseAnalytics.publishedCourses,
                        totalEnrollments: courseAnalytics.totalEnrollments,
                        averageEnrollmentsPerCourse: (courseAnalytics.totalEnrollments / courseAnalytics.totalCourses).toFixed(1)
                    },
                    topPerformingCourses: topCourses,
                    highCompletionRateCourses: highCompletionCourses,
                    allCourseStats: courseAnalytics.courseStats
                }
            });
        } catch (error) {
            this.logger.error('Error fetching course metrics:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve course metrics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get user engagement metrics
    async getUserMetrics(req, res) {
        try {
            this.logger.info('Fetching user metrics');
            
            const stats = await dashboardService.getDashboardStats();
            const courseAnalytics = await dashboardService.getCourseAnalytics();
            
            return res.status(200).json({
                success: true,
                message: 'User metrics retrieved successfully',
                data: {
                    userStats: {
                        totalUsers: stats.users.total,
                        activeUsers: stats.users.active,
                        inactiveUsers: stats.users.total - stats.users.active,
                        userEngagementRate: ((stats.users.active / stats.users.total) * 100).toFixed(1)
                    },
                    enrollmentStats: {
                        totalEnrollments: stats.enrollments.total,
                        activeEnrollments: stats.enrollments.active,
                        completedEnrollments: stats.enrollments.total - stats.enrollments.active,
                        averageEnrollmentsPerUser: (stats.enrollments.total / stats.users.total).toFixed(1),
                        enrollmentCompletionRate: (((stats.enrollments.total - stats.enrollments.active) / stats.enrollments.total) * 100).toFixed(1)
                    }
                }
            });
        } catch (error) {
            this.logger.error('Error fetching user metrics:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve user metrics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get learning progress metrics
    async getLearningMetrics(req, res) {
        try {
            this.logger.info('Fetching learning metrics');
            
            const [moduleAnalytics, lessonAnalytics, quizAnalytics] = await Promise.all([
                dashboardService.getModuleAnalytics(),
                dashboardService.getLessonAnalytics(),
                dashboardService.getQuizAnalytics()
            ]);
            
            return res.status(200).json({
                success: true,
                message: 'Learning metrics retrieved successfully',
                data: {
                    moduleMetrics: {
                        totalModules: moduleAnalytics.totalModules,
                        averageLessonsPerModule: moduleAnalytics.averageLessonsPerModule.toFixed(1),
                        topModules: moduleAnalytics.moduleStats
                            .sort((a, b) => b.lessonCount - a.lessonCount)
                            .slice(0, 5)
                    },
                    lessonMetrics: {
                        totalLessons: lessonAnalytics.totalLessons,
                        lessonsWithQuizzes: lessonAnalytics.lessonsWithQuizzes,
                        quizCoverageRate: ((lessonAnalytics.lessonsWithQuizzes / lessonAnalytics.totalLessons) * 100).toFixed(1)
                    },
                    quizMetrics: {
                        totalQuizzes: quizAnalytics.totalQuizzes,
                        totalAttempts: quizAnalytics.totalAttempts,
                        averageAttemptsPerQuiz: (quizAnalytics.totalAttempts / quizAnalytics.totalQuizzes).toFixed(1),
                        topPerformingQuizzes: quizAnalytics.quizStats
                            .sort((a, b) => b.averageScore - a.averageScore)
                            .slice(0, 5)
                    }
                }
            });
        } catch (error) {
            this.logger.error('Error fetching learning metrics:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve learning metrics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get quick stats for dashboard widgets
    async getQuickStats(req, res) {
        try {
            this.logger.info('Fetching quick stats');
            
            const stats = await dashboardService.getDashboardStats();
            
            return res.status(200).json({
                success: true,
                message: 'Quick stats retrieved successfully',
                data: {
                    widgets: [
                        {
                            title: 'Total Users',
                            value: stats.users.total,
                            change: '+12%', // This could be calculated based on historical data
                            trend: 'up',
                            icon: 'users'
                        },
                        {
                            title: 'Active Courses',
                            value: stats.courses.published,
                            change: '+8%',
                            trend: 'up',
                            icon: 'book'
                        },
                        {
                            title: 'Total Enrollments',
                            value: stats.enrollments.total,
                            change: '+15%',
                            trend: 'up',
                            icon: 'user-check'
                        },
                        {
                            title: 'Active Quizzes',
                            value: stats.quizzes.active,
                            change: '+5%',
                            trend: 'up',
                            icon: 'clipboard-list'
                        }
                    ],
                    summary: {
                        totalUsers: stats.users.total,
                        totalCourses: stats.courses.total,
                        publishedCourses: stats.courses.published,
                        totalEnrollments: stats.enrollments.total,
                        userEngagementRate: ((stats.users.active / stats.users.total) * 100).toFixed(1) + '%'
                    }
                }
            });
        } catch (error) {
            this.logger.error('Error fetching quick stats:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve quick stats',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Health check endpoint for dashboard
    async healthCheck(req, res) {
        try {
            return res.status(200).json({
                success: true,
                message: 'Dashboard service is healthy',
                timestamp: new Date().toISOString(),
                status: 'operational'
            });
        } catch (error) {
            this.logger.error('Dashboard health check failed:', error);
            return res.status(500).json({
                success: false,
                message: 'Dashboard service health check failed',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}

module.exports = new DashboardController();