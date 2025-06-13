const express = require('express');
const cors = require('cors');
const path = require('path');
const FirestoreServices = require('./services/firestoreServices');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// app.use(cors({
//   //origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
//   credentials: true
// }));
//new Middleware
app.use(cors())

app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../public')));

// Input validation middleware
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

// Routes

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
      enrollments: {
        'POST /api/enroll': 'Enroll a user in a course'
      },
      dashboard: {
        'GET /api/dashboard/stats': 'Get dashboard statistics',
        'GET /api/dashboard/activity': 'Get recent activity'
      },
      system: {
        'GET /api/health': 'Check API health status'
      }
    }
  });
});

// Serve dashboard HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Get all users
app.get('/api/users', asyncHandler(async (req, res) => {
  try {
    const users = await FirestoreServices.getAllUsers();
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'Failed to retrieve users'
    });
  }
}));

// Get all courses
app.get('/api/courses', asyncHandler(async (req, res) => {
  try {
    const courses = await FirestoreServices.getAllCourses();
    res.json({
      success: true,
      data: courses,
      count: courses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'Failed to retrieve courses'
    });
  }
}));

// Get all modules
app.get('/api/modules', asyncHandler(async (req, res) => {
  try {
    const modules = await FirestoreServices.getAllModules();
    res.json({ success: true, data: modules, count: modules.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Get specific module by ID
app.get('/api/modules/:moduleId', asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  try {
    const module = await FirestoreServices.getModuleById(moduleId);
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
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'Failed to retrieve module'
    });
  }
}));

// Get modules for a specific course
app.get('/api/courses/:courseId/modules', asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  try {
    const modules = await FirestoreServices.getModulesByCourseId(courseId);
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Get all lessons
app.get('/api/lessons', asyncHandler(async (req, res) => {
  try {
    const lessons = await FirestoreServices.getAllLessons();
    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Get lessons for a specific module
app.get('/api/modules/:moduleId/lessons', asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  try {
    const lessons = await FirestoreServices.getLessonsByModuleId(moduleId);
    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

//  Optional: Get lessons by courseId + moduleId
app.get('/api/courses/:courseId/modules/:moduleId/lessons', asyncHandler(async (req, res) => {
  const { courseId, moduleId } = req.params;
  try {
    const lessons = await FirestoreServices.getLessonsByCourseAndModule(courseId, moduleId);
    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Get dashboard statistics
app.get('/api/dashboard/stats', asyncHandler(async (req, res) => {
  try {
    const stats = await FirestoreServices.getDashboardStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'Failed to retrieve dashboard statistics'
    });
  }
}));

// Get recent activity
app.get('/api/dashboard/activity', asyncHandler(async (req, res) => {
  try {
    const activity = await FirestoreServices.getRecentActivity();
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'Failed to retrieve recent activity'
    });
  }
}));

// Enroll user in course
app.post('/api/enroll', asyncHandler(async (req, res) => {
  try {
    const { email, courseName } = req.body;
    
    // Validate required fields
    const missingFields = validateRequired(['email', 'courseName'], req.body);
    if (missingFields) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        error: 'Validation failed'
      });
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Validation failed'
      });
    }
    
    const result = await FirestoreServices.enrollUserInCourse(email.trim(), courseName.trim());
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('already enrolled') ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: 'Enrollment failed'
    });
  }
}));

// Create new user
app.post('/api/users', asyncHandler(async (req, res) => {
  try {
    const { userId, username, email } = req.body;
    
    // Validate required fields
    const missingFields = validateRequired(['userId', 'username', 'email'], req.body);
    if (missingFields) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        error: 'Validation failed'
      });
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Validation failed'
      });
    }
    
    const newUser = await FirestoreServices.createUser({
      userId: userId.trim(),
      username: username.trim(),
      email: email.trim()
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    const statusCode = error.message.includes('already exists') ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: 'User creation failed'
    });
  }
}));

// Create new course
app.post('/api/courses', asyncHandler(async (req, res) => {
  try {
    const { courseId, courseName, description } = req.body;
    
    // Validate required fields
    const missingFields = validateRequired(['courseId', 'courseName', 'description'], req.body);
    if (missingFields) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        error: 'Validation failed'
      });
    }
    
    const newCourse = await FirestoreServices.createCourse({
      courseId: courseId.trim(),
      courseName: courseName.trim(),
      description: description.trim()
    });
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse
    });
  } catch (error) {
    const statusCode = error.message.includes('already exists') ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: 'Course creation failed'
    });
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TechLaunch API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug endpoint to list all modules
app.get('/api/debug/modules', asyncHandler(async (req, res) => {
  try {
    const modules = await FirestoreServices.debugListAllModules();
    res.json({
      success: true,
      data: modules,
      count: modules.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'Failed to list modules'
    });
  }
}));

// Migrate lessons to consistent structure
app.post('/api/modules/:moduleId/migrate-lessons', asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  try {
    const result = await FirestoreServices.migrateLessonsToConsistentStructure(moduleId);
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'Failed to migrate lessons'
    });
  }
}));

// Global error handler
app.use((error, req, res, next) => {
  console.error('🔥 Global error handler:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log('📝 Available endpoints:');
  console.log('  GET  /api/modules');
  console.log('  GET  /api/courses/:courseId/modules');
  console.log('  GET  /api/modules/:moduleId/lessons');
  console.log('  GET  /api/courses/:courseId/modules/:moduleId/lessons');
});

module.exports = app;