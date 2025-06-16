const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// ================================
// MIDDLEWARE
// ================================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`📥 ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../public')));

// ================================
// VALIDATION MIDDLEWARE
// ================================

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateRequired = (fields, body) => {
    const missing = fields.filter(field => !body[field] || body[field].trim() === '');
    return missing.length === 0 ? null : missing;
};

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ================================
// SERVICES IMPORT
// ================================

// Import services
const userService = require('./services/firestore/userService');
const courseService = require('./services/firestore/courseService');
const moduleService = require('./services/firestore/moduleService');
const lessonService = require('./services/firestore/lessonService');
const quizService = require('./services/firestore/quizServices'); // Note: using your file name
const enrollmentService = require('./services/firestore/enrollmentService');

// ================================
// ROUTES INTEGRATION
// ================================

// Import route files
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const quizRoutes = require('./routes/quizzesRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Register routes with API prefix
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ================================
// NESTED QUIZ ROUTES
// ================================

const quizController = require('./controllers/quizController');

// Get quizzes for a lesson
app.get('/api/courses/:courseId/modules/:moduleId/lessons/:lessonId/quizzes', 
    asyncHandler(async (req, res) => {
        const { lessonId } = req.params;
        req.params.lessonId = lessonId;
        await quizController.getQuizzesByLesson(req, res);
    })
);

// Create quiz within lesson
app.post('/api/courses/:courseId/modules/:moduleId/lessons/:lessonId/quizzes', 
    asyncHandler(async (req, res) => {
        const { courseId, moduleId, lessonId } = req.params;
        req.body = { ...req.body, courseId, moduleId, lessonId };
        await quizController.createQuiz(req, res);
    })
);

// Get specific quiz
app.get('/api/courses/:courseId/modules/:moduleId/lessons/:lessonId/quizzes/:quizId', 
    asyncHandler(async (req, res) => {
        const { quizId } = req.params;
        req.params.id = quizId;
        await quizController.getQuizById(req, res);
    })
);

// Submit quiz attempt
app.post('/api/courses/:courseId/modules/:moduleId/lessons/:lessonId/quizzes/:quizId/attempt', 
    asyncHandler(async (req, res) => {
        const { courseId, moduleId, lessonId, quizId } = req.params;
        req.body = { ...req.body, courseId, moduleId, lessonId };
        req.params.quizId = quizId;
        await quizController.submitQuizAttempt(req, res);
    })
);

// ================================
// HEALTH CHECK ENDPOINT
// ================================

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ================================
// DASHBOARD & STATISTICS
// ================================

// API Documentation
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'TechLaunch API Documentation',
        version: '1.0.0',
        endpoints: {
            users: {
                'GET /api/users': 'Get all users',
                'POST /api/users': 'Create a new user'
            },
            courses: {
                'GET /api/courses': 'Get all courses',
                'POST /api/courses': 'Create a new course'
            },
            modules: {
                'GET /api/modules': 'Get all modules',
                'POST /api/modules': 'Create a new module'
            },
            lessons: {
                'GET /api/lessons': 'Get all lessons',
                'POST /api/lessons': 'Create a new lesson'
            },
            quizzes: {
                'GET /api/quizzes': 'Get all quizzes',
                'POST /api/quizzes': 'Create a new quiz'
            },
            enrollments: {
                'GET /api/enrollments': 'Get all enrollments',
                'POST /api/enrollments': 'Create a new enrollment'
            },
            dashboard: {
                'GET /api/dashboard/stats': 'Get dashboard statistics',
                'GET /api/dashboard/activity': 'Get recent activity'
            },
            health: {
                'GET /api/health': 'Health check endpoint'
            }
        }
    });
});

// Dashboard statistics including quizzes
app.get('/api/dashboard/stats', asyncHandler(async (req, res) => {
    try {
        // Get all stats in parallel
        const [users, courses, modules, lessons, quizzes, enrollments] = await Promise.all([
            userService.getAllUsers(),
            courseService.getAllCourses(),
            moduleService.getAllModules(),
            lessonService.getAllLessons(),
            quizService.getAllQuizzes(),
            enrollmentService.getAllEnrollments()
        ]);

        // Calculate statistics
        const stats = {
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
                total: enrollments.length
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Failed to retrieve dashboard statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

// Recent activity endpoint
app.get('/api/dashboard/activity', asyncHandler(async (req, res) => {
    try {
        // You can implement this based on your needs
        // For now, returning a placeholder
        const recentActivity = [
            {
                type: 'enrollment',
                message: 'New user enrolled in course',
                timestamp: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            data: recentActivity
        });
    } catch (error) {
        logger.error('Failed to retrieve recent activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve recent activity',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

// ================================
// ROOT ENDPOINT
// ================================

app.get('/', (req, res) => {
    res.json({
        message: 'Learning Management System API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            users: '/api/users',
            courses: '/api/courses',
            modules: '/api/modules',
            lessons: '/api/lessons',
            quizzes: '/api/quizzes',
            enrollments: '/api/enrollments',
            dashboard: '/api/dashboard',
            health: '/api/health',
            docs: '/api'
        }
    });
});

// ================================
// ERROR HANDLING
// ================================

// 404 handler
app.use('*', (req, res) => {
    logger.warn('404 - Endpoint not found', { 
        method: req.method, 
        url: req.originalUrl, 
        ip: req.ip 
    });
    
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
        availableEndpoints: {
            docs: '/api',
            health: '/api/health',
            users: '/api/users',
            courses: '/api/courses',
            modules: '/api/modules',
            lessons: '/api/lessons',
            quizzes: '/api/quizzes',
            enrollments: '/api/enrollments',
            dashboard: '/api/dashboard'
        }
    });
});

// Global error handler
app.use((error, req, res, next) => {
    logger.error('🔥 Global error handler:', { 
        error: error.message,
        stack: error.stack,
        path: req.originalUrl,
        method: req.method,
        status: error.status || 500
    });
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
});

// ================================
// SERVER STARTUP & SHUTDOWN
// ================================

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
        logger.info('✅ HTTP server closed.');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        logger.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
    logger.info(`📊 Health Check: http://localhost:${PORT}/api/health`);
    logger.info('📝 Available endpoints:', {
        endpoints: [
            'GET  /',
            'GET  /api',
            'GET  /api/health',
            'GET  /api/users',
            'GET  /api/courses',
            'GET  /api/modules',
            'GET  /api/lessons',
            'GET  /api/quizzes',
            'GET  /api/enrollments',
            'GET  /api/dashboard/stats',
            'GET  /api/dashboard/activity'
        ]
    });
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection:', {
        reason: reason,
        promise: promise
    });
    gracefulShutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', {
        error: error.message,
        stack: error.stack
    });
    gracefulShutdown('uncaughtException');
});

module.exports = app;