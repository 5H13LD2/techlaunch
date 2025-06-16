const { initializeFirebase, admin } = require('../../config/firebase-config');

// Initialize Firebase and get db instance
const db = initializeFirebase();

class ModulesService {
  // Get all modules with enhanced structure detection
  static async getAllModules() {
    try {
      console.log('🔍 Getting all modules...');
      
      // Get all courses first
      const coursesSnapshot = await db.collection('courses').get();
      const modules = [];
      
      // For each course, get its modules from both possible subcollections
      for (const courseDoc of coursesSnapshot.docs) {
        const courseId = courseDoc.id;
        const moduleCollections = ['modules', 'module']; // Support both naming conventions
        
        for (const moduleCollection of moduleCollections) {
          try {
            const modulesSnapshot = await db
              .collection('courses')
              .doc(courseId)
              .collection(moduleCollection)
              .get();
              
            modulesSnapshot.forEach(doc => {
              const moduleData = doc.data();
              modules.push({
                id: moduleData.id || doc.id,
                moduleId: moduleData.moduleId || moduleData.id || doc.id,
                courseId: moduleData.courseId || courseId,
                title: moduleData.title,
                description: moduleData.description,
                order: moduleData.order || 0,
                estimatedMinutes: moduleData.estimatedMinutes || moduleData.estimatedMinutess || 0,
                totalLessons: moduleData.totalLessons || 0,
                isUnlocked: moduleData.isUnlocked || false,
                createdAt: moduleData.createdAt,
                updatedAt: moduleData.updatedAt,
                source: moduleCollection // Track which collection this came from
              });
            });
            
            if (modulesSnapshot.size > 0) {
              console.log(`📚 Found ${modulesSnapshot.size} modules in ${courseId}/${moduleCollection}`);
            }
          } catch (error) {
            // Skip if subcollection doesn't exist
            console.log(`⚠️ No ${moduleCollection} subcollection in course ${courseId}`);
          }
        }
      }
      
      // Remove duplicates and sort modules by course and order
      const uniqueModules = modules.filter((module, index, self) => 
        index === self.findIndex(m => m.moduleId === module.moduleId && m.courseId === module.courseId)
      );
      
      uniqueModules.sort((a, b) => {
        if (a.courseId !== b.courseId) {
          return a.courseId.localeCompare(b.courseId);
        }
        return (a.order || 0) - (b.order || 0);
      });
      
      console.log(`📚 Retrieved ${uniqueModules.length} unique modules`);
      return uniqueModules;
    } catch (error) {
      console.error('❌ Error getting modules:', error.message);
      throw new Error('Failed to retrieve modules from database');
    }
  }

  // Enhanced method to get specific module by ID
  static async getModuleById(courseId, moduleId) {
    try {
      console.log('🔍 Getting module by ID:', moduleId, 'in course:', courseId);
      
      // Try both 'modules' and 'module' subcollections
      const moduleCollections = ['modules', 'module'];
      
      for (const moduleCollection of moduleCollections) {
        try {
          const moduleDoc = await db
            .collection('courses')
            .doc(courseId)
            .collection(moduleCollection)
            .doc(moduleId)
            .get();

          if (moduleDoc.exists) {
            const moduleData = moduleDoc.data();
            
            console.log(`✅ Found module in ${courseId}/${moduleCollection}/${moduleId}`);
            return {
              id: moduleData.id || moduleDoc.id,
              moduleId: moduleData.moduleId || moduleData.id || moduleDoc.id,
              courseId: moduleData.courseId || courseId,
              title: moduleData.title,
              description: moduleData.description,
              order: moduleData.order || 0,
              estimatedMinutes: moduleData.estimatedMinutes || moduleData.estimatedMinutess || 0,
              totalLessons: moduleData.totalLessons || 0,
              isUnlocked: moduleData.isUnlocked || false,
              createdAt: moduleData.createdAt,
              updatedAt: moduleData.updatedAt,
              source: moduleCollection
            };
          }
        } catch (error) {
          console.log(`⚠️ Error checking ${moduleCollection}:`, error.message);
        }
      }
      
      console.log('❌ Module not found:', moduleId, 'in course:', courseId);
      return null;
    } catch (error) {
      console.error('❌ Error getting module by ID:', error.message);
      throw new Error(`Failed to retrieve module: ${error.message}`);
    }
  }

  // Get modules by course ID with enhanced support
  static async getModulesByCourseId(courseId) {
    try {
      console.log(`🔍 Getting modules for course: ${courseId}`);
      const modules = [];
      const moduleCollections = ['modules', 'module'];
      
      for (const moduleCollection of moduleCollections) {
        try {
          const snapshot = await db
            .collection('courses')
            .doc(courseId)
            .collection(moduleCollection)
            .get();
          
          const collectionModules = snapshot.docs.map(doc => ({
            id: doc.id,
            moduleId: doc.id,
            source: moduleCollection,
            ...doc.data()
          }));
          
          modules.push(...collectionModules);
          
          if (collectionModules.length > 0) {
            console.log(`📚 Found ${collectionModules.length} modules in ${courseId}/${moduleCollection}`);
          }
        } catch (error) {
          console.log(`⚠️ No ${moduleCollection} collection in course ${courseId}`);
        }
      }
      
      // Remove duplicates and sort by order
      const uniqueModules = modules.filter((module, index, self) => 
        index === self.findIndex(m => m.moduleId === module.moduleId)
      );
      
      uniqueModules.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log(`📚 Retrieved ${uniqueModules.length} total modules for course ${courseId}`);
      return uniqueModules;
    } catch (error) {
      console.error('❌ Error getting modules by course:', error.message);
      throw new Error('Failed to retrieve modules for course');
    }
  }

  // Create new module
  static async createModule(courseId, moduleData) {
    try {
      const { moduleId, title, description, order, estimatedMinutes, isUnlocked } = moduleData;
      
      // Determine which module collection to use (default to 'modules')
      const moduleCollection = 'modules';
      
      const newModule = {
        moduleId: moduleId || title.toLowerCase().replace(/\s+/g, '_'),
        courseId,
        title,
        description: description || '',
        order: order || 0,
        estimatedMinutes: estimatedMinutes || 0,
        totalLessons: 0,
        isUnlocked: isUnlocked || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db
        .collection('courses')
        .doc(courseId)
        .collection(moduleCollection)
        .add(newModule);
      
      console.log(`✅ Created new module: ${title} in course ${courseId}`);
      return {
        id: docRef.id,
        ...newModule,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error creating module:', error);
      throw new Error(error.message || 'Failed to create module');
    }
  }

  // Update module
  static async updateModule(courseId, moduleId, updateData) {
    try {
      const moduleCollections = ['modules', 'module'];
      let moduleRef = null;
      let moduleCollection = null;
      
      // Find the module in the appropriate collection
      for (const collection of moduleCollections) {
        try {
          const tempRef = db
            .collection('courses')
            .doc(courseId)
            .collection(collection)
            .doc(moduleId);
          
          const moduleDoc = await tempRef.get();
          if (moduleDoc.exists) {
            moduleRef = tempRef;
            moduleCollection = collection;
            break;
          }
        } catch (error) {
          // Continue to next collection
        }
      }
      
      if (!moduleRef) {
        throw new Error('Module not found');
      }
      
      const updatedData = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await moduleRef.update(updatedData);
      
      console.log(`✅ Updated module: ${moduleId} in course ${courseId}`);
      return { success: true, message: 'Module updated successfully' };
    } catch (error) {
      console.error('❌ Error updating module:', error);
      throw new Error(error.message || 'Failed to update module');
    }
  }

  // Delete module
  static async deleteModule(courseId, moduleId) {
    try {
      const moduleCollections = ['modules', 'module'];
      let moduleRef = null;
      
      // Find the module in the appropriate collection
      for (const collection of moduleCollections) {
        try {
          const tempRef = db
            .collection('courses')
            .doc(courseId)
            .collection(collection)
            .doc(moduleId);
          
          const moduleDoc = await tempRef.get();
          if (moduleDoc.exists) {
            moduleRef = tempRef;
            break;
          }
        } catch (error) {
          // Continue to next collection
        }
      }
      
      if (!moduleRef) {
        throw new Error('Module not found');
      }
      
      // Delete all lessons in the module first
      const lessonsSnapshot = await moduleRef.collection('lessons').get();
      const batch = db.batch();
      
      lessonsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete the module itself
      batch.delete(moduleRef);
      
      await batch.commit();
      
      console.log(`✅ Deleted module: ${moduleId} and its lessons from course ${courseId}`);
      return { success: true, message: 'Module and associated lessons deleted successfully' };
    } catch (error) {
      console.error('❌ Error deleting module:', error);
      throw new Error(error.message || 'Failed to delete module');
    }
  }

  // Helper method to detect module collection structure
  static async _detectModuleStructure(courseId) {
    try {
      const moduleCollections = ['modules', 'module'];
      
      for (const collection of moduleCollections) {
        try {
          const snapshot = await db
            .collection('courses')
            .doc(courseId)
            .collection(collection)
            .limit(1)
            .get();
          
          if (!snapshot.empty) {
            return { type: collection, exists: true };
          }
        } catch (error) {
          // Continue to next collection
        }
      }
      
      return { type: 'modules', exists: false }; // Default to 'modules' if none exist
    } catch (error) {
      console.error('❌ Error detecting module structure:', error);
      return { type: 'modules', exists: false, error: error.message };
    }
  }
}

module.exports = ModulesService;