const express = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

// Import all controllers
const userController = require('../controllers/userController');
const courseController = require('../controllers/courseController');
const moduleController = require('../controllers/moduleController');
const lessonController = require('../controllers/lessonController');
const enrollController = require('../controllers/enrollController');
const quizController = require('../controllers/quizController');

// Import all services
const coursesService = require('../services/firestore/courseService');
const modulesService = require('../services/firestore/moduleService');
const lessonsService = require('../services/firestore/lessonService');
const quizzesService = require('../services/firestore/quizServices');
const userService = require('../services/firestore/userService');
const enrollmentService = require('../services/firestore/enrollmentService');

// Import validation middleware
const { validateEmailParam, validateCourseNameParam } = require('../middleware/validateRequest');

const router = express.Router();