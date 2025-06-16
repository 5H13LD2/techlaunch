const LessonsService = require('../services/LessonsService');
const logger = require('../utils/logger');

class LessonController {
  constructor() {
    this.lessonsService = new LessonsService();
  }

  /**
   * Get lessons by module ID
   * GET /api/lessons/module/:moduleId
   */
  async getLessonsByModule(req, res) {
    try {
      const { moduleId } = req.params;
      
      if (!moduleId) {
        return res.status(400).json({
          success: false,
          message: 'Module ID is required'
        });
      }

      logger.info(`Getting lessons for module: ${moduleId}`);
      const lessons = await this.lessonsService.getLessonsByModuleId(moduleId);

      res.status(200).json({
        success: true,
        data: lessons,
        count: lessons.length,
        message: `Retrieved ${lessons.length} lessons for module ${moduleId}`
      });
    } catch (error) {
      logger.error('Error getting lessons by module:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lessons',
        error: error.message
      });
    }
  }

  /**
   * Get all lessons
   * GET /api/lessons
   */
  async getAllLessons(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      
      logger.info('Getting all lessons');
      
      if (search) {
        const lessons = await this.lessonsService.searchLessons(search);
        return res.status(200).json({
          success: true,
          data: lessons,
          count: lessons.length,
          message: `Found ${lessons.length} lessons matching "${search}"`
        });
      }

      const lessons = await this.lessonsService.getAllLessons();

      // Simple pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedLessons = lessons.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: paginatedLessons,
        count: paginatedLessons.length,
        total: lessons.length,
        page: parseInt(page),
        totalPages: Math.ceil(lessons.length / limit),
        message: 'Successfully retrieved lessons'
      });
    } catch (error) {
      logger.error('Error getting all lessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lessons',
        error: error.message
      });
    }
  }

  /**
   * Get lessons by course and module
   * GET /api/lessons/course/:courseId/module/:moduleId
   */
  async getLessonsByCourseAndModule(req, res) {
    try {
      const { courseId, moduleId } = req.params;
      
      if (!courseId || !moduleId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID and Module ID are required'
        });
      }

      logger.info(`Getting lessons for course ${courseId} and module ${moduleId}`);
      const lessons = await this.lessonsService.getLessonsByCourseAndModule(courseId, moduleId);

      res.status(200).json({
        success: true,
        data: lessons,
        count: lessons.length,
        message: `Retrieved ${lessons.length} lessons for course ${courseId} and module ${moduleId}`
      });
    } catch (error) {
      logger.error('Error getting lessons by course and module:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lessons',
        error: error.message
      });
    }
  }

  /**
   * Get lesson by ID
   * GET /api/lessons/:lessonId
   */
  async getLessonById(req, res) {
    try {
      const { lessonId } = req.params;
      const { moduleId, courseId } = req.query;
      
      if (!lessonId) {
        return res.status(400).json({
          success: false,
          message: 'Lesson ID is required'
        });
      }

      logger.info(`Getting lesson by ID: ${lessonId}`);
      const lesson = await this.lessonsService.getLessonById(lessonId, moduleId, courseId);

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      res.status(200).json({
        success: true,
        data: lesson,
        message: 'Lesson retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting lesson by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lesson',
        error: error.message
      });
    }
  }

  /**
   * Create a new lesson
   * POST /api/lessons
   */
  async createLesson(req, res) {
    try {
      const lessonData = req.body;
      const { storageType = 'top-level', courseId, moduleId } = req.body;

      // Validate required fields
      if (!lessonData.title) {
        return res.status(400).json({
          success: false,
          message: 'Lesson title is required'
        });
      }

      if (storageType === 'nested' && (!courseId || !moduleId)) {
        return res.status(400).json({
          success: false,
          message: 'Course ID and Module ID are required for nested storage'
        });
      }

      logger.info(`Creating new lesson: ${lessonData.title}`);
      const newLesson = await this.lessonsService.createLesson(
        lessonData, 
        storageType, 
        courseId, 
        moduleId
      );

      res.status(201).json({
        success: true,
        data: newLesson,
        message: 'Lesson created successfully'
      });
    } catch (error) {
      logger.error('Error creating lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create lesson',
        error: error.message
      });
    }
  }

  /**
   * Update a lesson
   * PUT /api/lessons/:lessonId
   */
  async updateLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const updateData = req.body;
      const { courseId, moduleId } = req.query;

      if (!lessonId) {
        return res.status(400).json({
          success: false,
          message: 'Lesson ID is required'
        });
      }

      logger.info(`Updating lesson: ${lessonId}`);
      const updatedLesson = await this.lessonsService.updateLesson(
        lessonId, 
        updateData, 
        courseId, 
        moduleId
      );

      res.status(200).json({
        success: true,
        data: updatedLesson,
        message: 'Lesson updated successfully'
      });
    } catch (error) {
      logger.error('Error updating lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update lesson',
        error: error.message
      });
    }
  }

  /**
   * Delete a lesson
   * DELETE /api/lessons/:lessonId
   */
  async deleteLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const { courseId, moduleId } = req.query;

      if (!lessonId) {
        return res.status(400).json({
          success: false,
          message: 'Lesson ID is required'
        });
      }

      logger.info(`Deleting lesson: ${lessonId}`);
      const result = await this.lessonsService.deleteLesson(lessonId, courseId, moduleId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Lesson deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete lesson',
        error: error.message
      });
    }
  }

  /**
   * Search lessons
   * GET /api/lessons/search
   */
  async searchLessons(req, res) {
    try {
      const { q: searchTerm, moduleId, courseId } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      logger.info(`Searching lessons with term: ${searchTerm}`);
      const lessons = await this.lessonsService.searchLessons(searchTerm, {
        moduleId,
        courseId
      });

      res.status(200).json({
        success: true,
        data: lessons,
        count: lessons.length,
        message: `Found ${lessons.length} lessons matching "${searchTerm}"`
      });
    } catch (error) {
      logger.error('Error searching lessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search lessons',
        error: error.message
      });
    }
  }

  /**
   * Get lessons with pagination
   * GET /api/lessons/paginated
   */
  async getLessonsWithPagination(req, res) {
    try {
      const options = {
        limit: parseInt(req.query.limit) || 10,
        startAfter: req.query.startAfter || null,
        moduleId: req.query.moduleId || null,
        courseId: req.query.courseId || null,
        orderBy: req.query.orderBy || 'order',
        orderDirection: req.query.orderDirection || 'asc'
      };

      logger.info('Getting lessons with pagination');
      const result = await this.lessonsService.getLessonsWithPagination(options);

      res.status(200).json({
        success: true,
        data: result.lessons || result,
        count: result.lessons ? result.lessons.length : result.length,
        hasMore: result.hasMore || false,
        lastDoc: result.lastDoc || null,
        message: 'Successfully retrieved paginated lessons'
      });
    } catch (error) {
      logger.error('Error getting lessons with pagination:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve paginated lessons',
        error: error.message
      });
    }
  }
}

module.exports = LessonController;