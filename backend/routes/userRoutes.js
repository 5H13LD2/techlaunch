const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const userService = require('../services/firestore/userService');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error) {
        logger.error('❌ Error getting users:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve users'
        });
    }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userService.getById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('❌ Error getting user:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve user'
        });
    }
});

// Create new user
router.post('/', async (req, res) => {
    try {
        const { userId, username, email } = req.body;
        
        // Validate required fields
        const missingFields = ['userId', 'username', 'email'].filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                error: 'Validation failed'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
                error: 'Validation failed'
            });
        }
        
        const newUser = await userService.create({
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
        logger.error('❌ Error creating user:', error);
        const statusCode = error.message.includes('already exists') ? 409 : 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message,
            error: 'User creation failed'
        });
    }
});

// Update user
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;
        
        const updatedUser = await userService.update(userId, updateData);
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        logger.error('❌ Error updating user:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to update user'
        });
    }
});

// Delete user
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await userService.delete(userId);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        logger.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to delete user'
        });
    }
});

// Get user's enrolled courses
router.get('/:userId/courses', async (req, res) => {
    try {
        const { userId } = req.params;
        const courses = await userService.getUserCourses(userId);
        
        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        logger.error('❌ Error getting user courses:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve user courses'
        });
    }
});

// Get user's recent activity
router.get('/:userId/activity', async (req, res) => {
    try {
        const { userId } = req.params;
        const activity = await userService.getUserActivity(userId);
        
        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        logger.error('❌ Error getting user activity:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve user activity'
        });
    }
});

module.exports = router;