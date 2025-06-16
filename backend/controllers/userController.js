const userService = require('../services/firestore/userService');
const logger = require('../utils/logger');

class UserController {
  /**
   * Get all users
   * GET /api/users
   */
  async getAllUsers(req, res) {
    try {
      logger.debug('UserController: Getting all users');
      const users = await userService.getAll();
      
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error('UserController: Error getting all users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user by email
   * GET /api/users/:email
   */
  async getUserByEmail(req, res) {
    try {
      const { email } = req.params;
      logger.debug(`UserController: Getting user by email: ${email}`);
      
      const user = await userService.getByEmail(email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User not found with email: ${email}`
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      logger.error(`UserController: Error getting user by email ${req.params.email}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create a new user
   * POST /api/users
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      logger.debug(`UserController: Creating new user: ${userData.email}`);
      
      const newUser = await userService.create(userData);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (error) {
      logger.error(`UserController: Error creating user:`, error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user's enrolled courses
   * GET /api/users/:email/courses
   */
  async getUserCourses(req, res) {
    try {
      const { email } = req.params;
      logger.debug(`UserController: Getting courses for user: ${email}`);
      
      const user = await userService.getByEmail(email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User not found with email: ${email}`
        });
      }
      
      const enrolledCourses = user.courseTaken || [];
      
      res.status(200).json({
        success: true,
        message: 'User courses retrieved successfully',
        data: {
          userEmail: email,
          courseTaken: enrolledCourses,
          totalCourses: enrolledCourses.length
        }
      });
    } catch (error) {
      logger.error(`UserController: Error getting user courses for ${req.params.email}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user courses',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get users statistics
   * GET /api/users/stats
   */
  async getUserStats(req, res) {
    try {
      logger.debug('UserController: Getting user statistics');
      const users = await userService.getAll();
      
      const stats = {
        totalUsers: users.length,
        usersWithCourses: users.filter(user => user.courseTaken && user.courseTaken.length > 0).length,
        usersWithoutCourses: users.filter(user => !user.courseTaken || user.courseTaken.length === 0).length,
        averageCoursesPerUser: users.length > 0 ? 
          users.reduce((sum, user) => sum + (user.courseTaken ? user.courseTaken.length : 0), 0) / users.length : 0
      };
      
      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('UserController: Error getting user statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new UserController();