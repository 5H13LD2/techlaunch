const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const LessonService = require('../services/firestore/lessonService');

// Initialize the lesson service
const lessonService = new LessonService();

// Get lessons by course and module (NEW ROUTE)
router.get('/courses/:courseId/modules/:moduleId/lessons', async (req, res) => {
  const { courseId, moduleId } = req.params;
  try {
    logger.info(`🔍 Fetching lessons for course ${courseId} and module ${moduleId}`);
    const lessons = await lessonService.getLessonsByCourseAndModule(courseId, moduleId);
    
    logger.info(`📦 Found ${lessons.length} lessons`);
    res.json({ 
      success: true, 
      data: lessons,
      count: lessons.length
    });
  } catch (error) {
    logger.error('❌ Failed to fetch course module lessons', { 
      courseId, 
      moduleId, 
      error: error.message 
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch lessons',
      error: error.message 
    });
  }
});

// Get all lessons
router.get('/', async (req, res) => {
  try {
    logger.info('🔍 Fetching all lessons');
    const lessons = await lessonService.getAllLessons();
    logger.info(`📦 Found ${lessons.length} lessons`);
    res.json({ success: true, data: lessons });
  } catch (error) {
    logger.error('❌ Failed to fetch lessons', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get lessons by module ID
router.get('/module/:moduleId', async (req, res) => {
  const { moduleId } = req.params;
  try {
    logger.info(`🔍 Fetching lessons for module: ${moduleId}`);
    const lessons = await lessonService.getLessonsByModuleId(moduleId);
    logger.info(`📦 Found ${lessons.length} lessons`);
    res.json({ success: true, data: lessons });
  } catch (error) {
    logger.error('❌ Failed to fetch module lessons', { 
      moduleId, 
      error: error.message 
    });
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get lessons by course and module
router.get('/course/:courseId/module/:moduleId', async (req, res) => {
  const { courseId, moduleId } = req.params;
  try {
    logger.api(`Fetching lessons for course ${courseId} and module ${moduleId}`);
    const lessons = await lessonService.getLessonsByCourseAndModule(courseId, moduleId);
    res.json({ success: true, data: lessons });
  } catch (error) {
    logger.error('Failed to fetch course module lessons', { 
      courseId, 
      moduleId, 
      error: error.message 
    });
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new lesson
router.post('/', async (req, res) => {
  try {
    const lessonData = req.body;
    logger.api('Creating new lesson', { lessonData });
    
    // TODO: Add validation middleware
    if (!lessonData.moduleId || !lessonData.title) {
      return res.status(400).json({
        success: false,
        message: 'Module ID and title are required'
      });
    }
    
    // TODO: Implement lesson creation in FirestoreServices
    // const newLesson = await FirestoreServices.createLesson(lessonData);
    
    res.status(201).json({
      success: true,
      message: 'Lesson creation endpoint - Not implemented yet',
      data: lessonData
    });
  } catch (error) {
    logger.error('Failed to create lesson', { 
      error: error.message,
      lessonData: req.body
    });
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update lesson
router.put('/:lessonId', async (req, res) => {
  const { lessonId } = req.params;
  try {
    const updateData = req.body;
    logger.api(`Updating lesson: ${lessonId}`, { updateData });
    
    // TODO: Implement lesson update in FirestoreServices
    // const updatedLesson = await FirestoreServices.updateLesson(lessonId, updateData);
    
    res.json({
      success: true,
      message: 'Lesson update endpoint - Not implemented yet',
      data: { lessonId, ...updateData }
    });
  } catch (error) {
    logger.error('Failed to update lesson', { 
      lessonId,
      error: error.message,
      updateData: req.body
    });
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete lesson
router.delete('/:lessonId', async (req, res) => {
  const { lessonId } = req.params;
  try {
    logger.api(`Deleting lesson: ${lessonId}`);
    
    // TODO: Implement lesson deletion in FirestoreServices
    // await FirestoreServices.deleteLesson(lessonId);
    
    res.json({
      success: true,
      message: 'Lesson deletion endpoint - Not implemented yet',
      data: { lessonId }
    });
  } catch (error) {
    logger.error('Failed to delete lesson', { 
      lessonId,
      error: error.message
    });
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;