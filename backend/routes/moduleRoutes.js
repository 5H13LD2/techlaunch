const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const FirestoreServices = require('../services/firestore/moduleService');

// ================================
// MODULE ROUTES
// ================================

// Get all modules for a course
router.get('/:courseId/modules', async (req, res) => {
    try {
        const { courseId } = req.params;
        console.log('🔍 Fetching modules for course:', courseId);
        const modules = await FirestoreServices.getCourseModules(courseId);
        
        console.log('📦 Found modules:', modules.length);
        
        res.json({
            success: true,
            data: modules,
            count: modules.length
        });
    } catch (error) {
        logger.error('❌ Error getting modules:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve modules'
        });
    }
});

// Get module by ID
router.get('/:courseId/modules/:moduleId', async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const module = await FirestoreServices.getModuleById(courseId, moduleId);
        
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
        logger.error('❌ Error getting module:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve module'
        });
    }
});

// Create new module
router.post('/:courseId/modules', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { moduleName, description, order, status = 'active' } = req.body;
        
        // Validate required fields
        const missingFields = ['moduleName', 'description'].filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                error: 'Validation failed'
            });
        }
        
        const newModule = await FirestoreServices.createModule(courseId, {
            moduleName: moduleName.trim(),
            description: description.trim(),
            order: order || 0,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        res.status(201).json({
            success: true,
            message: 'Module created successfully',
            data: newModule
        });
    } catch (error) {
        logger.error('❌ Error creating module:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Module creation failed'
        });
    }
});

// Update module
router.put('/:courseId/modules/:moduleId', async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const updateData = {
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        const updatedModule = await FirestoreServices.updateModule(courseId, moduleId, updateData);
        
        if (!updatedModule) {
            return res.status(404).json({
                success: false,
                message: 'Module not found'
            });
        }

        res.json({
            success: true,
            message: 'Module updated successfully',
            data: updatedModule
        });
    } catch (error) {
        logger.error('❌ Error updating module:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to update module'
        });
    }
});

// Delete module
router.delete('/:courseId/modules/:moduleId', async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        await FirestoreServices.deleteModule(courseId, moduleId);
        
        res.json({
            success: true,
            message: 'Module deleted successfully'
        });
    } catch (error) {
        logger.error('❌ Error deleting module:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to delete module'
        });
    }
});

// Get module lessons
router.get('/:courseId/modules/:moduleId/lessons', async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const lessons = await FirestoreServices.getModuleLessons(courseId, moduleId);
        
        res.json({
            success: true,
            data: lessons
        });
    } catch (error) {
        logger.error('❌ Error getting module lessons:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to retrieve module lessons'
        });
    }
});

// Reorder modules
router.put('/:courseId/modules/reorder', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { moduleOrder } = req.body;
        
        if (!Array.isArray(moduleOrder)) {
            return res.status(400).json({
                success: false,
                message: 'moduleOrder must be an array',
                error: 'Validation failed'
            });
        }
        
        await FirestoreServices.reorderModules(courseId, moduleOrder);
        
        res.json({
            success: true,
            message: 'Modules reordered successfully'
        });
    } catch (error) {
        logger.error('❌ Error reordering modules:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Failed to reorder modules'
        });
    }
});

module.exports = router;
