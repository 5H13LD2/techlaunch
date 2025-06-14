/* this is a comment nigga pwedeng idelete

const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const schemas = {
  enrollUser: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    courseName: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Course name cannot be empty',
      'string.max': 'Course name cannot exceed 100 characters',
      'any.required': 'Course name is required'
    })
  }),

  createUser: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Name cannot be empty',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
    courseTaken: Joi.array().items(Joi.string()).optional().default([])
  }),

  createCourse: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Course name cannot be empty',
      'string.max': 'Course name cannot exceed 100 characters',
      'any.required': 'Course name is required'
    }),
    description: Joi.string().min(1).max(500).optional().messages({
      'string.min': 'Description cannot be empty',
      'string.max': 'Description cannot exceed 500 characters'
    }),
    duration: Joi.string().optional(),
    difficulty: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').optional(),
    category: Joi.string().optional()
  })
};

/**
 * Generic validation middleware factory
 * @param {string} schemaName - Name of the schema to validate against
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */

/* this is a comment nigga pwedeng idelete
const validateRequest = (schemaName, source = 'body') => {
  return (req, res, next) => {
    try {
      const schema = schemas[schemaName];
      
      if (!schema) {
        logger.error(`Validation schema not found: ${schemaName}`);
        return res.status(500).json({
          success: false,
          message: 'Internal validation error'
        });
      }

      const dataToValidate = req[source];
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Report all validation errors
        stripUnknown: true // Remove unknown properties
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`Validation failed for ${schemaName}:`, errorMessages);
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }

      // Replace the original data with validated and sanitized data
      req[source] = value;
      next();
    } catch (validationError) {
      logger.error('Validation middleware error:', validationError);
      return res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };
};

/**
 * Middleware to validate email parameter
 */

/* this is a comment nigga pwedeng idelete
const validateEmailParam = (req, res, next) => {
  const emailSchema = Joi.string().email().required();
  const { error } = emailSchema.validate(req.params.email);
  
  if (error) {
    logger.warn(`Invalid email parameter: ${req.params.email}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid email format in URL parameter'
    });
  }
  
  next();
};

/**
 * Middleware to validate course name parameter
 */

/* this is a comment nigga pwedeng idelete
const validateCourseNameParam = (req, res, next) => {
  const courseNameSchema = Joi.string().min(1).max(100).required();
  const { error } = courseNameSchema.validate(req.params.courseName);
  
  if (error) {
    logger.warn(`Invalid course name parameter: ${req.params.courseName}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid course name in URL parameter'
    });
  }
  
  next();
};

/**
 * Middleware to sanitize input data
 */

/* this is a comment nigga pwedeng idelete
const sanitizeInput = (req, res, next) => {
  // Sanitize strings in request body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace and remove potentially harmful characters
        req.body[key] = req.body[key].trim().replace(/[<>]/g, '');
      }
    }
  }
  
  next();
};

module.exports = {
  validateRequest,
  validateEmailParam,
  validateCourseNameParam,
  sanitizeInput,
  schemas
}; */