const ModulesService = require('../services/ModulesService');

class ModuleController {
  // Get all modules
  static async getAllModules(req, res) {
    try {
      console.log('🎯 Controller: Getting all modules');
      const modules = await ModulesService.getAllModules();
      
      res.status(200).json({
        success: true,
        message: 'Modules retrieved successfully',
        data: modules,
        count: modules.length
      });
    } catch (error) {
      console.error('❌ Controller error - getAllModules:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve modules',
        error: error.message
      });
    }
  }

  // Get module by ID
  static async getModuleById(req, res) {
    try {
      const { moduleId, courseId } = req.params;
      
      if (!moduleId || !courseId) {
        return res.status(400).json({
          success: false,
          message: 'Module ID and Course ID are required'
        });
      }

      console.log('🎯 Controller: Getting module by ID:', moduleId, 'in course:', courseId);
      const module = await ModulesService.getModuleById(courseId, moduleId);
      
      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Module retrieved successfully',
        data: module
      });
    } catch (error) {
      console.error('❌ Controller error - getModuleById:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve module',
        error: error.message
      });
    }
  }

  // Get modules by course ID
  static async getModulesByCourseId(req, res) {
    try {
      const { courseId } = req.params;
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
      }

      console.log('🎯 Controller: Getting modules for course:', courseId);
      const modules = await ModulesService.getModulesByCourseId(courseId);
      
      res.status(200).json({
        success: true,
        message: 'Course modules retrieved successfully',
        data: modules,
        count: modules.length,
        courseId: courseId
      });
    } catch (error) {
      console.error('❌ Controller error - getModulesByCourseId:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve course modules',
        error: error.message
      });
    }
  }

  // Create new module
  static async createModule(req, res) {
    try {
      const { courseId } = req.params;
      const moduleData = req.body;
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
      }

      // Validate required fields
      const { title } = moduleData;
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Module title is required'
        });
      }

      console.log('🎯 Controller: Creating module for course:', courseId);
      const newModule = await ModulesService.createModule(courseId, moduleData);
      
      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: newModule
      });
    } catch (error) {
      console.error('❌ Controller error - createModule:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create module',
        error: error.message
      });
    }
  }

  // Update module
  static async updateModule(req, res) {
    try {
      const { courseId, moduleId } = req.params;
      const updateData = req.body;
      
      if (!courseId || !moduleId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID and Module ID are required'
        });
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Update data is required'
        });
      }

      console.log('🎯 Controller: Updating module:', moduleId, 'in course:', courseId);
      const result = await ModulesService.updateModule(courseId, moduleId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Controller error - updateModule:', error.message);
      
      if (error.message === 'Module not found') {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update module',
        error: error.message
      });
    }
  }

  // Delete module
  static async deleteModule(req, res) {
    try {
      const { courseId, moduleId } = req.params;
      
      if (!courseId || !moduleId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID and Module ID are required'
        });
      }

      console.log('🎯 Controller: Deleting module:', moduleId, 'from course:', courseId);
      const result = await ModulesService.deleteModule(courseId, moduleId);
      
      res.status(200).json({
        success: true,
        message: 'Module deleted successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Controller error - deleteModule:', error.message);
      
      if (error.message === 'Module not found') {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete module',
        error: error.message
      });
    }
  }

  // Get module structure info (helper endpoint)
  static async getModuleStructure(req, res) {
    try {
      const { courseId } = req.params;
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
      }

      console.log('🎯 Controller: Getting module structure for course:', courseId);
      const structure = await ModulesService._detectModuleStructure(courseId);
      
      res.status(200).json({
        success: true,
        message: 'Module structure retrieved successfully',
        data: structure,
        courseId: courseId
      });
    } catch (error) {
      console.error('❌ Controller error - getModuleStructure:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve module structure',
        error: error.message
      });
    }
  }

  // Bulk operations - Get modules for multiple courses
  static async getModulesForMultipleCourses(req, res) {
    try {
      const { courseIds } = req.body;
      
      if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Array of course IDs is required'
        });
      }

      console.log('🎯 Controller: Getting modules for multiple courses:', courseIds);
      
      const results = {};
      const errors = {};
      
      // Process each course ID
      for (const courseId of courseIds) {
        try {
          const modules = await ModulesService.getModulesByCourseId(courseId);
          results[courseId] = modules;
        } catch (error) {
          errors[courseId] = error.message;
        }
      }
      
      const hasErrors = Object.keys(errors).length > 0;
      
      res.status(hasErrors ? 207 : 200).json({
        success: !hasErrors,
        message: hasErrors ? 'Partial success - some courses failed' : 'All course modules retrieved successfully',
        data: results,
        errors: hasErrors ? errors : undefined,
        totalCourses: courseIds.length,
        successfulCourses: Object.keys(results).length
      });
    } catch (error) {
      console.error('❌ Controller error - getModulesForMultipleCourses:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve modules for multiple courses',
        error: error.message
      });
    }
  }
}

module.exports = ModuleController;