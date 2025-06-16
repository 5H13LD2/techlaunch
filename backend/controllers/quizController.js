// ================================
// 2. controllers/quizController.js
// ================================

const quizService = require('../services/firestore/quizServices');
const logger = require('../utils/logger');

class QuizController {
  // Get all quizzes from java_quiz collection
  async getAllQuizzes(req, res) {
    try {
      logger.info('Fetching all quizzes from java_quiz collection');
      const quizzes = await quizService.getQuizzesByCollection('java_quiz');
      
      res.status(200).json({ 
        success: true, 
        data: quizzes,
        count: quizzes.length
      });
    } catch (error) {
      logger.error('Error fetching quizzes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch quizzes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get specific quiz by ID from java_quiz collection
  async getQuizById(req, res) {
    try {
      const { quizId } = req.params;
      logger.info(`Fetching quiz ${quizId} from java_quiz collection`);
      
      const doc = await quizService.getQuizFromCollection('java_quiz', quizId);
      
      if (!doc) {
        logger.warn(`Quiz ${quizId} not found`);
        return res.status(404).json({ 
          success: false, 
          message: 'Quiz not found' 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: doc 
      });
    } catch (error) {
      logger.error(`Error fetching quiz ${req.params.quizId}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch quiz',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get quizzes by lesson
  async getQuizzesByLesson(req, res) {
    try {
      const { lessonId } = req.params;
      logger.info(`Accessed quizzes for lesson ${lessonId}`, { lessonId, user: req.user?.id || null });
      const quizzes = await quizService.getQuizzesByLesson(lessonId);
      
      res.status(200).json({
        success: true,
        data: quizzes,
        message: 'Lesson quizzes retrieved successfully'
      });
    } catch (error) {
      logger.error(`Failed to fetch quizzes for lesson ${req.params.lessonId}`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson quizzes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get quizzes by course
  async getQuizzesByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const quizzes = await quizService.getQuizzesByCourse(courseId);
      
      res.status(200).json({
        success: true,
        data: quizzes,
        message: 'Course quizzes retrieved successfully'
      });
    } catch (error) {
      logger.error(`Failed to fetch quizzes for course ${req.params.courseId}`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course quizzes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create quiz
  async createQuiz(req, res) {
    try {
      const quiz = await quizService.createQuiz(req.body);
      res.status(201).json({
        success: true,
        data: quiz,
        message: 'Quiz created successfully'
      });
    } catch (error) {
      logger.error('Failed to create quiz', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create quiz',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update quiz
  async updateQuiz(req, res) {
    try {
      const { id } = req.params;
      const quiz = await quizService.updateQuiz(id, req.body);
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      res.status(200).json({
        success: true,
        data: quiz,
        message: 'Quiz updated successfully'
      });
    } catch (error) {
      logger.error(`Failed to update quiz ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to update quiz',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete quiz
  async deleteQuiz(req, res) {
    try {
      const { id } = req.params;
      await quizService.deleteQuiz(id);
      
      res.status(200).json({
        success: true,
        message: 'Quiz deleted successfully'
      });
    } catch (error) {
      logger.error(`Failed to delete quiz ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete quiz',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Submit quiz attempt
  async submitQuizAttempt(req, res) {
    try {
      const { quizId } = req.params;
      const attempt = await quizService.submitQuizAttempt(quizId, req.body);
      
      res.status(201).json({
        success: true,
        data: attempt,
        message: 'Quiz attempt submitted successfully'
      });
    } catch (error) {
      logger.error(`Failed to submit quiz attempt for quiz ${req.params.quizId}`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit quiz attempt',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get quiz attempts
  async getQuizAttempts(req, res) {
    try {
      const { quizId, userId } = req.params;
      const attempts = await quizService.getQuizAttempts(quizId, userId);
      
      res.status(200).json({
        success: true,
        data: attempts,
        message: 'Quiz attempts retrieved successfully'
      });
    } catch (error) {
      logger.error(`Failed to fetch quiz attempts`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quiz attempts',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user's best attempt
  async getUserBestAttempt(req, res) {
    try {
      const { quizId, userId } = req.params;
      const attempt = await quizService.getUserBestAttempt(quizId, userId);
      
      res.status(200).json({
        success: true,
        data: attempt,
        message: 'Best attempt retrieved successfully'
      });
    } catch (error) {
      logger.error(`Failed to fetch best attempt`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch best attempt',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get quiz analytics
  async getQuizAnalytics(req, res) {
    try {
      const { quizId } = req.params;
      const analytics = await quizService.getQuizAnalytics(quizId);
      
      res.status(200).json({
        success: true,
        data: analytics,
        message: 'Quiz analytics retrieved successfully'
      });
    } catch (error) {
      logger.error(`Failed to fetch quiz analytics`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quiz analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Toggle quiz status
  async toggleQuizStatus(req, res) {
    try {
      const { id } = req.params;
      const quiz = await quizService.toggleQuizStatus(id);
      
      res.status(200).json({
        success: true,
        data: quiz,
        message: 'Quiz status updated successfully'
      });
    } catch (error) {
      logger.error(`Failed to toggle quiz status`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle quiz status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get quiz by lesson
  async getQuizByLesson(req, res) {
    try {
      const { courseId, moduleId, lessonId } = req.params;
      logger.info(`Accessing quizzes for course: ${courseId}, module: ${moduleId}, lesson: ${lessonId}`);

      const quizzes = await quizService.getQuizByLesson(courseId, moduleId, lessonId);
      
      if (!quizzes.length) {
        logger.warn(`No quizzes found for lesson ${lessonId}`);
        return res.status(404).json({ 
          success: false, 
          message: 'No quizzes found for this lesson.' 
        });
      }

      logger.info(`Successfully retrieved ${quizzes.length} quizzes for lesson ${lessonId}`);
      res.status(200).json({
        success: true,
        data: quizzes,
        message: 'Quizzes retrieved successfully'
      });
    } catch (error) {
      logger.error(`Failed to fetch quizzes for lesson ${req.params.lessonId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quizzes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new QuizController();