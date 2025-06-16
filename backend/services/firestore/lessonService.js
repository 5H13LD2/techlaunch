const { initializeFirebase, admin } = require('../../config/firebase-config');
const logger = require('../../utils/logger');

// Initialize Firebase and get db instance
const db = initializeFirebase();

/**
 * Service class for handling lesson-related operations
 * Supports both top-level lessons collection and nested lesson structures
 */
class LessonsService {
  constructor() {
    this.db = db;
    this.admin = admin;
    this.logger = logger.child({ service: 'LessonsService' });
  }

  /**
   * Helper method to determine lesson storage structure for a module
   * @param {string} moduleId - The module ID to check
   * @param {string} courseId - Optional course ID for nested structures
   * @returns {Object} Structure information
   */
  async _detectLessonStructure(moduleId, courseId = null) {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Detecting lesson structure', { moduleId, courseId });
      
      // First, try to find lessons in the top-level collection
      const topLevelLessons = await this.db.collection('lessons')
        .where('moduleId', '==', moduleId)
        .limit(1)
        .get();
      
      if (!topLevelLessons.empty) {
        const duration = Date.now() - startTime;
        this.logger.performanceMetric('detectLessonStructure', duration, { 
          moduleId, 
          structureType: 'top-level' 
        });
        return { type: 'top-level', path: 'lessons' };
      }
      
      // If courseId is provided or can be derived, try nested structure
      if (!courseId && moduleId.includes('_')) {
        courseId = moduleId.split('_')[0] + '_course';
        this.logger.debug('Derived courseId from moduleId', { moduleId, derivedCourseId: courseId });
      }
      
      if (courseId) {
        // Try nested structure: /courses/{courseId}/modules/{moduleId}/lessons
        const nestedLessons = await this.db
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .doc(moduleId)
          .collection('lessons')
          .limit(1)
          .get();
        
        if (!nestedLessons.empty) {
          const duration = Date.now() - startTime;
          this.logger.performanceMetric('detectLessonStructure', duration, { 
            moduleId, 
            courseId,
            structureType: 'nested' 
          });
          return { 
            type: 'nested', 
            path: `courses/${courseId}/modules/${moduleId}/lessons`,
            courseId,
            moduleId
          };
        }
        
        // Try alternative nested structure: /courses/{courseId}/module/{moduleId}/lessons
        const altNestedLessons = await this.db
          .collection('courses')
          .doc(courseId)
          .collection('module')
          .doc(moduleId)
          .collection('lessons')
          .limit(1)
          .get();
        
        if (!altNestedLessons.empty) {
          const duration = Date.now() - startTime;
          this.logger.performanceMetric('detectLessonStructure', duration, { 
            moduleId, 
            courseId,
            structureType: 'alt-nested' 
          });
          return { 
            type: 'alt-nested', 
            path: `courses/${courseId}/module/${moduleId}/lessons`,
            courseId,
            moduleId
          };
        }
      }
      
      const duration = Date.now() - startTime;
      this.logger.performanceMetric('detectLessonStructure', duration, { 
        moduleId, 
        courseId,
        structureType: 'none' 
      });
      return { type: 'none', path: null };
    } catch (error) {
      this.logger.structuredError(error, { 
        operation: 'detectLessonStructure', 
        moduleId, 
        courseId 
      });
      return { type: 'error', path: null, error: error.message };
    }
  }

  /**
   * Get lessons by module ID with hybrid support for different storage structures
   * @param {string} moduleId - The module ID
   * @returns {Array} Array of lesson objects
   */
  async getLessonsByModuleId(moduleId) {
    const startTime = Date.now();
    
    try {
      this.logger.lesson('Getting lessons by module ID', { moduleId });
      
      // Detect the storage structure for this module
      const structure = await this._detectLessonStructure(moduleId);
      this.logger.debug('Detected lesson structure', { moduleId, structure });
      
      let lessons = [];
      
      switch (structure.type) {
        case 'top-level':
          const topLevelSnapshot = await this.db.collection('lessons')
            .where('moduleId', '==', moduleId)
            .get();
          
          lessons = topLevelSnapshot.docs.map(doc => ({
            id: doc.id,
            source: 'top-level',
            ...doc.data()
          }));
          
          this.logger.firebaseOperation('query', 'lessons', moduleId, { 
            count: lessons.length,
            source: 'top-level'
          });
          break;
          
        case 'nested':
          const nestedSnapshot = await this.db
            .collection('courses')
            .doc(structure.courseId)
            .collection('modules')
            .doc(structure.moduleId)
            .collection('lessons')
            .get();
          
          lessons = nestedSnapshot.docs.map(doc => ({
            id: doc.id,
            source: 'nested-modules',
            courseId: structure.courseId,
            moduleId: structure.moduleId,
            ...doc.data()
          }));
          
          this.logger.firebaseOperation('query', 'nested-modules/lessons', moduleId, { 
            count: lessons.length,
            courseId: structure.courseId
          });
          break;
          
        case 'alt-nested':
          const altNestedSnapshot = await this.db
            .collection('courses')
            .doc(structure.courseId)
            .collection('module')
            .doc(structure.moduleId)
            .collection('lessons')
            .get();
          
          lessons = altNestedSnapshot.docs.map(doc => ({
            id: doc.id,
            source: 'nested-module',
            courseId: structure.courseId,
            moduleId: structure.moduleId,
            ...doc.data()
          }));
          
          this.logger.firebaseOperation('query', 'nested-module/lessons', moduleId, { 
            count: lessons.length,
            courseId: structure.courseId
          });
          break;
          
        case 'none':
          this.logger.warn('No lessons found for module', { moduleId });
          lessons = [];
          break;
          
        case 'error':
          throw new Error(`Structure detection failed: ${structure.error}`);
          
        default:
          this.logger.warn('Unknown lesson structure type', { 
            moduleId, 
            structureType: structure.type 
          });
          lessons = [];
      }
      
      // Sort by order if available
      lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const duration = Date.now() - startTime;
      this.logger.performanceMetric('getLessonsByModuleId', duration, {
        moduleId,
        lessonsCount: lessons.length,
        structureType: structure.type
      });
      
      return lessons;
    } catch (error) {
      this.logger.structuredError(error, { 
        operation: 'getLessonsByModuleId', 
        moduleId 
      });
      throw new Error(`Failed to retrieve lessons for module: ${error.message}`);
    }
  }

  /**
   * Get all lessons with hybrid support for different storage structures
   * @returns {Array} Array of all lesson objects
   */
  async getAllLessons() {
    const startTime = Date.now();
    
    try {
      this.logger.lesson('Getting all lessons from all structures');
      const allLessons = [];
      
      // Get lessons from top-level collection
      try {
        const topLevelSnapshot = await this.db.collection('lessons').get();
        const topLevelLessons = topLevelSnapshot.docs.map(doc => ({
          id: doc.id,
          source: 'top-level',
          ...doc.data()
        }));
        allLessons.push(...topLevelLessons);
        
        this.logger.firebaseOperation('query', 'lessons', 'all', { 
          count: topLevelLessons.length,
          source: 'top-level'
        });
      } catch (error) {
        this.logger.warn('Error accessing top-level lessons collection', { error: error.message });
      }
      
      // Get lessons from nested structures
      try {
        const coursesSnapshot = await this.db.collection('courses').get();
        
        for (const courseDoc of coursesSnapshot.docs) {
          const courseId = courseDoc.id;
          const moduleCollections = ['modules', 'module'];
          
          for (const moduleCollection of moduleCollections) {
            try {
              const modulesSnapshot = await this.db
                .collection('courses')
                .doc(courseId)
                .collection(moduleCollection)
                .get();
              
              for (const moduleDoc of modulesSnapshot.docs) {
                const moduleId = moduleDoc.id;
                
                try {
                  const lessonsSnapshot = await this.db
                    .collection('courses')
                    .doc(courseId)
                    .collection(moduleCollection)
                    .doc(moduleId)
                    .collection('lessons')
                    .get();
                  
                  const nestedLessons = lessonsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    source: `nested-${moduleCollection}`,
                    courseId,
                    moduleId,
                    ...doc.data()
                  }));
                  
                  allLessons.push(...nestedLessons);
                  
                  if (nestedLessons.length > 0) {
                    this.logger.firebaseOperation('query', `${moduleCollection}/lessons`, 
                      `${courseId}/${moduleId}`, { 
                        count: nestedLessons.length 
                      });
                  }
                } catch (lessonError) {
                  // Skip if lessons subcollection doesn't exist
                  this.logger.debug('Lessons subcollection not found', { 
                    courseId, 
                    moduleCollection, 
                    moduleId 
                  });
                }
              }
            } catch (moduleError) {
              // Skip if module collection doesn't exist
              this.logger.debug('Module collection not found', { 
                courseId, 
                moduleCollection 
              });
            }
          }
        }
      } catch (error) {
        this.logger.warn('Error accessing nested lesson structures', { error: error.message });
      }
      
      // Remove duplicates based on lesson ID and moduleId combination
      const uniqueLessons = allLessons.filter((lesson, index, self) => 
        index === self.findIndex(l => 
          l.id === lesson.id && (l.moduleId || '') === (lesson.moduleId || '')
        )
      );
      
      const duration = Date.now() - startTime;
      this.logger.performanceMetric('getAllLessons', duration, {
        totalLessons: allLessons.length,
        uniqueLessons: uniqueLessons.length,
        duplicatesRemoved: allLessons.length - uniqueLessons.length
      });
      
      return uniqueLessons;
    } catch (error) {
      this.logger.structuredError(error, { operation: 'getAllLessons' });
      throw new Error('Failed to retrieve lessons from database');
    }
  }

  /**
   * Get lessons by course and module
   * @param {string} courseId - The course ID
   * @param {string} moduleId - The module ID
   * @returns {Array} Array of lesson objects
   */
  async getLessonsByCourseAndModule(courseId, moduleId) {
    const startTime = Date.now();
    
    try {
      this.logger.lesson('Getting lessons by course and module', { courseId, moduleId });
      
      const moduleCollections = ['modules', 'module'];
      
      for (const moduleCollection of moduleCollections) {
        try {
          // Verify the module exists first
          const moduleDoc = await this.db
            .collection('courses')
            .doc(courseId)
            .collection(moduleCollection)
            .doc(moduleId)
            .get();

          if (moduleDoc.exists) {
            const lessonsSnapshot = await this.db
              .collection('courses')
              .doc(courseId)
              .collection(moduleCollection)
              .doc(moduleId)
              .collection('lessons')
              .get();
            
            const lessons = lessonsSnapshot.docs.map(doc => ({
              id: doc.id,
              source: `${moduleCollection}-nested`,
              courseId,
              moduleId,
              ...doc.data()
            }));

            // Sort by order if available
            lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            const duration = Date.now() - startTime;
            this.logger.performanceMetric('getLessonsByCourseAndModule', duration, {
              courseId,
              moduleId,
              moduleCollection,
              lessonsCount: lessons.length
            });
            
            this.logger.firebaseOperation('query', `${moduleCollection}/lessons`, 
              `${courseId}/${moduleId}`, { count: lessons.length });
            
            return lessons;
          }
        } catch (error) {
          this.logger.debug('Error checking module collection', { 
            moduleCollection, 
            error: error.message 
          });
        }
      }
      
      this.logger.warn('Module not found in course', { courseId, moduleId });
      return [];
    } catch (error) {
      this.logger.structuredError(error, { 
        operation: 'getLessonsByCourseAndModule', 
        courseId, 
        moduleId 
      });
      throw new Error('Failed to retrieve lessons for course and module');
    }
  }

  /**
   * Get a specific lesson by ID
   * @param {string} lessonId - The lesson ID
   * @param {string} moduleId - Optional module ID for context
   * @param {string} courseId - Optional course ID for nested structures
   * @returns {Object|null} Lesson object or null if not found
   */
  async getLessonById(lessonId, moduleId = null, courseId = null) {
    const startTime = Date.now();
    
    try {
      this.logger.lesson('Getting lesson by ID', { lessonId, moduleId, courseId });
      
      // First try top-level lessons collection
      try {
        const topLevelDoc = await this.db.collection('lessons').doc(lessonId).get();
        if (topLevelDoc.exists) {
          const duration = Date.now() - startTime;
          this.logger.performanceMetric('getLessonById', duration, {
            lessonId,
            source: 'top-level'
          });
          
          this.logger.firebaseOperation('get', 'lessons', lessonId, { 
            found: true, 
            source: 'top-level' 
          });
          
          return {
            id: topLevelDoc.id,
            source: 'top-level',
            ...topLevelDoc.data()
          };
        }
      } catch (error) {
        this.logger.debug('Error checking top-level lessons collection', { 
          lessonId, 
          error: error.message 
        });
      }
      
      // If moduleId and courseId are provided, try nested structure
      if (moduleId && courseId) {
        const moduleCollections = ['modules', 'module'];
        
        for (const moduleCollection of moduleCollections) {
          try {
            const nestedDoc = await this.db
              .collection('courses')
              .doc(courseId)
              .collection(moduleCollection)
              .doc(moduleId)
              .collection('lessons')
              .doc(lessonId)
              .get();
            
            if (nestedDoc.exists) {
              const duration = Date.now() - startTime;
              this.logger.performanceMetric('getLessonById', duration, {
                lessonId,
                courseId,
                moduleId,
                source: `nested-${moduleCollection}`
              });
              
              this.logger.firebaseOperation('get', `${moduleCollection}/lessons`, 
                `${courseId}/${moduleId}/${lessonId}`, { 
                  found: true, 
                  source: `nested-${moduleCollection}` 
                });
              
              return {
                id: nestedDoc.id,
                source: `nested-${moduleCollection}`,
                courseId,
                moduleId,
                ...nestedDoc.data()
              };
            }
          } catch (error) {
            this.logger.debug('Error checking nested structure', { 
              moduleCollection, 
              lessonId, 
              error: error.message 
            });
          }
        }
      }
      
      this.logger.warn('Lesson not found', { lessonId, moduleId, courseId });
      return null;
    } catch (error) {
      this.logger.structuredError(error, { 
        operation: 'getLessonById', 
        lessonId, 
        moduleId, 
        courseId 
      });
      throw new Error(`Failed to retrieve lesson: ${error.message}`);
    }
  }

  /**
   * Create a new lesson
   * @param {Object} lessonData - The lesson data
   * @param {string} storageType - 'top-level' or 'nested'
   * @param {string} courseId - Required for nested storage
   * @param {string} moduleId - Required for nested storage
   * @returns {Object} Created lesson object
   */
  async createLesson(lessonData, storageType = 'top-level', courseId = null, moduleId = null) {
    const startTime = Date.now();
    
    try {
      this.logger.lesson('Creating new lesson', { 
        title: lessonData.title, 
        storageType, 
        courseId, 
        moduleId 
      });
      
      const timestamp = this.admin.firestore.FieldValue.serverTimestamp();
      const newLessonData = {
        ...lessonData,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      let docRef;
      
      if (storageType === 'nested' && courseId && moduleId) {
        // Determine which module collection to use
        const moduleCollections = ['modules', 'module'];
        let moduleExists = false;
        let targetModuleCollection = null;
        
        for (const moduleCollection of moduleCollections) {
          try {
            const moduleDoc = await this.db
              .collection('courses')
              .doc(courseId)
              .collection(moduleCollection)
              .doc(moduleId)
              .get();
            
            if (moduleDoc.exists) {
              moduleExists = true;
              targetModuleCollection = moduleCollection;
              break;
            }
          } catch (error) {
            this.logger.debug('Error checking module collection', { 
              moduleCollection, 
              error: error.message 
            });
          }
        }
        
        if (!moduleExists) {
          throw new Error(`Module ${moduleId} not found in course ${courseId}`);
        }
        
        docRef = await this.db
          .collection('courses')
          .doc(courseId)
          .collection(targetModuleCollection)
          .doc(moduleId)
          .collection('lessons')
          .add(newLessonData);
        
        this.logger.firebaseOperation('create', `${targetModuleCollection}/lessons`, 
          `${courseId}/${moduleId}/${docRef.id}`, { 
            title: lessonData.title,
            storageType: 'nested'
          });
      } else {
        // Create in top-level lessons collection
        docRef = await this.db.collection('lessons').add(newLessonData);
        
        this.logger.firebaseOperation('create', 'lessons', docRef.id, { 
          title: lessonData.title,
          storageType: 'top-level'
        });
      }
      
      const duration = Date.now() - startTime;
      this.logger.performanceMetric('createLesson', duration, {
        lessonId: docRef.id,
        storageType,
        courseId,
        moduleId
      });
      
      return {
        id: docRef.id,
        ...newLessonData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      this.logger.structuredError(error, { 
        operation: 'createLesson', 
        storageType, 
        courseId, 
        moduleId,
        lessonTitle: lessonData.title
      });
      throw new Error(`Failed to create lesson: ${error.message}`);
    }
  }

  /**
   * Update a lesson
   * @param {string} lessonId - The lesson ID
   * @param {Object} updateData - The data to update
   * @param {string} courseId - Optional course ID for nested structures
   * @param {string} moduleId - Optional module ID for nested structures
   * @returns {Object} Updated lesson object
   */
  async updateLesson(lessonId, updateData, courseId = null, moduleId = null) {
    const startTime = Date.now();
    
    try {
      this.logger.lesson('Updating lesson', { lessonId, courseId, moduleId });
      
      const timestamp = this.admin.firestore.FieldValue.serverTimestamp();
      const updatedData = {
        ...updateData,
        updatedAt: timestamp
      };
      
      // First try to find the lesson
      const lesson = await this.getLessonById(lessonId, moduleId, courseId);
      
      if (!lesson) {
        throw new Error(`Lesson ${lessonId} not found`);
      }
      
      let updateRef;
      
      if (lesson.source === 'top-level') {
        updateRef = this.db.collection('lessons').doc(lessonId);
      } else if (lesson.source.startsWith('nested-')) {
        const moduleCollection = lesson.source.split('-')[1];
        updateRef = this.db
          .collection('courses')
          .doc(lesson.courseId)
          .collection(moduleCollection)
          .doc(lesson.moduleId)
          .collection('lessons')
          .doc(lessonId);
      }
      
      await updateRef.update(updatedData);
      
      const duration = Date.now() - startTime;
      this.logger.performanceMetric('updateLesson', duration, {
        lessonId,
        source: lesson.source,
        fieldsUpdated: Object.keys(updateData).length
      });
      
      this.logger.firebaseOperation('update', lesson.source, lessonId, {
        fieldsUpdated: Object.keys(updateData)
      });
      
      return {
        id: lessonId,
        ...lesson,
        ...updatedData,
        updatedAt: new Date()
      };
    } catch (error) {
      this.logger.structuredError(error, { 
        operation: 'updateLesson', 
        lessonId, 
        courseId, 
        moduleId 
      });
      throw new Error(`Failed to update lesson: ${error.message}`);
    }
  }

  /**
   * Delete a lesson
   * @param {string} lessonId - The lesson ID
   * @param {string} courseId - Optional course ID for nested structures
   * @param {string} moduleId - Optional module ID for nested structures
   * @returns {Object} Deletion result
   */
  async deleteLesson(lessonId, courseId = null, moduleId = null) {
    const startTime = Date.now();
    
    try {
      this.logger.lesson('Deleting lesson', { lessonId, courseId, moduleId });
      
      const lesson = await this.getLessonById(lessonId, moduleId, courseId);
      
      if (!lesson) {
        throw new Error(`Lesson ${lessonId} not found`);
      }
      
      let deleteRef;
      
      if (lesson.source === 'top-level') {
        deleteRef = this.db.collection('lessons').doc(lessonId);
      } else if (lesson.source.startsWith('nested-')) {
        const moduleCollection = lesson.source.split('-')[1];
        deleteRef = this.db
          .collection('courses')
          .doc(lesson.courseId)
          .collection(moduleCollection)
          .doc(lesson.moduleId)
          .collection('lessons')
          .doc(lessonId);
      }
      
      await deleteRef.delete();
      
      const duration = Date.now() - startTime;
      this.logger.performanceMetric('deleteLesson', duration, {
        lessonId,
        source: lesson.source
      });
      
      this.logger.firebaseOperation('delete', lesson.source, lessonId, {
        title: lesson.title
      });
      
      return { id: lessonId, deleted: true };
    } catch (error) {
      this.logger.structuredError(error, { 
        operation: 'deleteLesson', 
        lessonId, 
        courseId, 
        moduleId 
      });
      throw new Error(`Failed to delete lesson: ${error.message}`);
    }
  }

  /**
   * Get lessons with pagination
   * @param {Object} options - Pagination options
   * @returns {Object} Paginated results
   */
  async getLessonsWithPagination(options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        limit = 10,
        startAfter = null,
        moduleId = null,
        courseId = null,
        orderBy = 'order',
        orderDirection = 'asc'
      } = options;
      
      this.logger.lesson('Getting lessons with pagination', { 
        limit, 
        moduleId, 
        courseId, 
        orderBy, 
        orderDirection 
      });
      
      let query;
      
      if (moduleId) {
        // Get lessons for specific module
        const lessons = await this.getLessonsByModuleId(moduleId);
        const duration = Date.now() - startTime;
        this.logger.performanceMetric('getLessonsWithPagination', duration, {
          moduleId,
          lessonsCount: lessons.length
        });
        return lessons;
      } else {
        // Get from top-level lessons collection with pagination
        query = this.db.collection('lessons')
          .orderBy(orderBy, orderDirection)
          .limit(limit);
        
        if (startAfter) {
          query = query.startAfter(startAfter);
        }
        
        const snapshot = await query.get();
        const lessons = snapshot.docs.map(doc => ({
          id: doc.id,
          source: 'top-level',
          ...doc.data()
        }));
        
        const duration = Date.now() - startTime;
        this.logger.performanceMetric('getLessonsWithPagination', duration, {
          limit,
          lessonsReturned: lessons.length,
          hasMore: lessons.length === limit
        });
        
        this.logger.firebaseOperation('query', 'lessons', 'paginated', {
          limit,
          lessonsReturned: lessons.length
        });
        
        return {
          lessons,
          hasMore: lessons.length === limit,
          lastDoc: lessons.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
        };
      }
    } catch (error) {
      this.logger.structuredError(error, { 
        operation: 'getLessonsWithPagination', 
        options 
      });
      throw new Error('Failed to retrieve lessons with pagination');
    }
  }

  /**
   * Search lessons by title or content
   * @param {string} searchTerm - The search term
   * @param {Object} options - Search options
   * @returns {Array} Array of matching lessons
   */
  async searchLessons(searchTerm, options = {}) {
    const startTime = Date.now();
    
    try {
      const { moduleId = null, courseId = null } = options;
      
      this.logger.lesson('Searching lessons', { searchTerm, moduleId, courseId });
      
      // Get all lessons first (this could be optimized with full-text search)
      let lessons;
      
      if (moduleId) {
        lessons = await this.getLessonsByModuleId(moduleId);
      } else if (courseId && moduleId) {
        lessons = await this.getLessonsByCourseAndModule(courseId, moduleId);
      } else {
        lessons = await this.getAllLessons();
      }
      
      // Filter lessons based on search term
      const searchResults = lessons.filter(lesson => {
        const title = (lesson.title || '').toLowerCase();
        const content = (lesson.content || '').toLowerCase();
        const description = (lesson.description || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return title.includes(searchLower) || 
               content.includes(searchLower) || 
               description.includes(searchLower);
      });
      
      const duration = Date.now() - startTime;
      this.logger.performanceMetric('searchLessons', duration, {
        searchTerm,
        totalLessons: lessons.length,
        resultsFound: searchResults.length
      });
      
      return searchResults;
    } catch (error) {
      this.logger.structuredError(error, { 
        operation: 'searchLessons', 
        searchTerm, 
        options 
      });
      throw new Error('Failed to search lessons');
    }
  }
}

module.exports = LessonsService;