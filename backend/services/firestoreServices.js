const { initializeFirebase, admin } = require('../config/firebase-config');

// Initialize Firebase and get db instance
const db = initializeFirebase();

class FirestoreServices {
  // Get all users with their course information
  static async getAllUsers() {
    try {
      const usersSnapshot = await db.collection('users').get();
      const users = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          userId: userData.userId || doc.id,
          username: userData.username || 'N/A',
          email: userData.email || 'N/A',
          coursesTaken: userData.coursesTaken || [],
          createdAt: userData.createdAt || null
        });
      });
      
      console.log(`📋 Retrieved ${users.length} users`);
      return users;
    } catch (error) {
      console.error('❌ Error getting users:', error);
      throw new Error('Failed to retrieve users from database');
    }
  }

  // Get all courses
  static async getAllCourses() {
    try {
      const coursesSnapshot = await db.collection('courses').get();
      const courses = [];
      
      coursesSnapshot.forEach(doc => {
        const courseData = doc.data();
        courses.push({
          id: doc.id,
          courseId: courseData.courseId || doc.id,
          courseName: courseData.courseName || 'Unnamed Course',
          description: courseData.description || 'No description available',
          enrolledUsers: courseData.enrolledUsers || [],
          createdAt: courseData.createdAt || null
        });
      });
      
      console.log(`📚 Retrieved ${courses.length} courses`);
      return courses;
    } catch (error) {
      console.error('❌ Error getting courses:', error);
      throw new Error('Failed to retrieve courses from database');
    }
  }

  // Get user by email
  static async getUserByEmail(email) {
    try {
      const userSnapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (userSnapshot.empty) {
        return null;
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      return {
        id: userDoc.id,
        userId: userData.userId || userDoc.id,
        username: userData.username || 'N/A',
        email: userData.email,
        coursesTaken: userData.coursesTaken || []
      };
    } catch (error) {
      console.error('❌ Error getting user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  // Get course by name
  static async getCourseByName(courseName) {
    try {
      const courseSnapshot = await db.collection('courses')
        .where('courseName', '==', courseName)
        .limit(1)
        .get();
      
      if (courseSnapshot.empty) {
        return null;
      }
      
      const courseDoc = courseSnapshot.docs[0];
      const courseData = courseDoc.data();
      
      return {
        id: courseDoc.id,
        courseId: courseData.courseId || courseDoc.id,
        courseName: courseData.courseName,
        description: courseData.description || 'No description available',
        enrolledUsers: courseData.enrolledUsers || []
      };
    } catch (error) {
      console.error('❌ Error getting course by name:', error);
      throw new Error('Failed to find course');
    }
  }

  // Enroll user in course using Firestore transaction
  static async enrollUserInCourse(userEmail, courseName) {
    try {
      const result = await db.runTransaction(async (transaction) => {
        // Get user by email
        const userQuery = await db.collection('users')
          .where('email', '==', userEmail)
          .limit(1)
          .get();
        
        if (userQuery.empty) {
          throw new Error('User not found');
        }
        
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        
        // Get course by name
        const courseQuery = await db.collection('courses')
          .where('courseName', '==', courseName)
          .limit(1)
          .get();
        
        if (courseQuery.empty) {
          throw new Error('Course not found');
        }
        
        const courseDoc = courseQuery.docs[0];
        const courseData = courseDoc.data();
        
        // Check if user is already enrolled
        const userCourses = userData.coursesTaken || [];
        if (userCourses.includes(courseName)) {
          throw new Error('User is already enrolled in this course');
        }
        
        // Update user's courses
        const updatedUserCourses = [...userCourses, courseName];
        transaction.update(userDoc.ref, {
          coursesTaken: updatedUserCourses,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update course's enrolled users
        const enrolledUsers = courseData.enrolledUsers || [];
        if (!enrolledUsers.includes(userEmail)) {
          const updatedEnrolledUsers = [...enrolledUsers, userEmail];
          transaction.update(courseDoc.ref, {
            enrolledUsers: updatedEnrolledUsers,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        return {
          userEmail,
          courseName,
          success: true,
          message: 'User successfully enrolled in course'
        };
      });
      
      console.log(`✅ Successfully enrolled ${userEmail} in ${courseName}`);
      return result;
    } catch (error) {
      console.error('❌ Error enrolling user:', error);
      throw new Error(error.message || 'Failed to enroll user in course');
    }
  }

  // Create new user
  static async createUser(userData) {
    try {
      const { userId, username, email } = userData;
      
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      const newUser = {
        userId,
        username,
        email,
        coursesTaken: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('users').add(newUser);
      
      console.log(`✅ Created new user: ${email} with ID: ${docRef.id}`);
      return {
        id: docRef.id,
        ...newUser,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  }

  // Create new course
  static async createCourse(courseData) {
    try {
      const { courseId, courseName, description } = courseData;
      
      // Check if course already exists
      const existingCourse = await this.getCourseByName(courseName);
      if (existingCourse) {
        throw new Error('Course with this name already exists');
      }
      
      const newCourse = {
        courseId,
        courseName,
        description,
        enrolledUsers: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('courses').add(newCourse);
      
      console.log(`✅ Created new course: ${courseName} with ID: ${docRef.id}`);
      return {
        id: docRef.id,
        ...newCourse,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error creating course:', error);
      throw new Error(error.message || 'Failed to create course');
    }
  }

  // Get dashboard statistics
  static async getDashboardStats() {
    try {
      const [usersSnapshot, coursesSnapshot] = await Promise.all([
        db.collection('users').get(),
        db.collection('courses').get()
      ]);
      
      // Calculate total enrollments
      let totalEnrollments = 0;
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        totalEnrollments += (userData.coursesTaken || []).length;
      });
      
      return {
        totalUsers: usersSnapshot.size,
        totalCourses: coursesSnapshot.size,
        totalEnrollments
      };
    } catch (error) {
      console.error('❌ Error getting dashboard stats:', error);
      throw new Error('Failed to retrieve dashboard statistics');
    }
  }

  // Get recent activity (last 10 enrollments)
  static async getRecentActivity() {
    try {
      // This is a simplified version - in a real app, you'd store enrollment history
      const users = await this.getAllUsers();
      const courses = await this.getAllCourses();
      
      const recentActivity = [];
      
      // Generate some sample recent activity based on existing data
      users.slice(0, 5).forEach(user => {
        if (user.coursesTaken && user.coursesTaken.length > 0) {
          recentActivity.push({
            type: 'enrollment',
            message: `${user.username} enrolled in ${user.coursesTaken[user.coursesTaken.length - 1]}`,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
          });
        }
      });
      
      return recentActivity.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ Error getting recent activity:', error);
      throw new Error('Failed to retrieve recent activity');
    }
  }

  // Helper method to determine lesson storage structure for a module
  static async _detectLessonStructure(moduleId, courseId = null) {
    try {
      // First, try to find lessons in the top-level collection
      const topLevelLessons = await db.collection('lessons')
        .where('moduleId', '==', moduleId)
        .limit(1)
        .get();
      
      if (!topLevelLessons.empty) {
        return { type: 'top-level', path: 'lessons' };
      }
      
      // If courseId is provided or can be derived, try nested structure
      if (!courseId && moduleId.includes('_')) {
        courseId = moduleId.split('_')[0] + '_course';
      }
      
      if (courseId) {
        // Try nested structure: /courses/{courseId}/modules/{moduleId}/lessons
        const nestedLessons = await db
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .doc(moduleId)
          .collection('lessons')
          .limit(1)
          .get();
        
        if (!nestedLessons.empty) {
          return { 
            type: 'nested', 
            path: `courses/${courseId}/modules/${moduleId}/lessons`,
            courseId,
            moduleId
          };
        }
        
        // Try alternative nested structure: /courses/{courseId}/module/{moduleId}/lessons
        const altNestedLessons = await db
          .collection('courses')
          .doc(courseId)
          .collection('module')
          .doc(moduleId)
          .collection('lessons')
          .limit(1)
          .get();
        
        if (!altNestedLessons.empty) {
          return { 
            type: 'alt-nested', 
            path: `courses/${courseId}/module/${moduleId}/lessons`,
            courseId,
            moduleId
          };
        }
      }
      
      return { type: 'none', path: null };
    } catch (error) {
      console.error('❌ Error detecting lesson structure:', error);
      return { type: 'error', path: null, error: error.message };
    }
  }

  // Enhanced method to get lessons by module ID with hybrid support
  static async getLessonsByModuleId(moduleId) {
    try {
      console.log('🔍 Getting lessons for module:', moduleId);
      
      // Detect the storage structure for this module
      const structure = await this._detectLessonStructure(moduleId);
      console.log('📍 Detected structure:', structure);
      
      let lessons = [];
      
      switch (structure.type) {
        case 'top-level':
          // Query top-level lessons collection
          const topLevelSnapshot = await db.collection('lessons')
            .where('moduleId', '==', moduleId)
            .get();
          
          lessons = topLevelSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          break;
          
        case 'nested':
          // Query nested lessons: /courses/{courseId}/modules/{moduleId}/lessons
          const nestedSnapshot = await db
            .collection('courses')
            .doc(structure.courseId)
            .collection('modules')
            .doc(structure.moduleId)
            .collection('lessons')
            .get();
          
          lessons = nestedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          break;
          
        case 'alt-nested':
          // Query alternative nested lessons: /courses/{courseId}/module/{moduleId}/lessons
          const altNestedSnapshot = await db
            .collection('courses')
            .doc(structure.courseId)
            .collection('module')
            .doc(structure.moduleId)
            .collection('lessons')
            .get();
          
          lessons = altNestedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          break;
          
        case 'none':
          console.log('⚠️ No lessons found for module:', moduleId);
          lessons = [];
          break;
          
        case 'error':
          throw new Error(`Structure detection failed: ${structure.error}`);
          
        default:
          console.log('⚠️ Unknown structure type:', structure.type);
          lessons = [];
      }
      
      // Sort by order if available
      lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log(`📝 Retrieved ${lessons.length} lessons for module ${moduleId} using ${structure.type} structure`);
      return lessons;
    } catch (error) {
      console.error('❌ Error getting lessons by module:', error.message);
      throw new Error(`Failed to retrieve lessons for module: ${error.message}`);
    }
  }

  // Enhanced method to get all lessons with hybrid support
  static async getAllLessons() {
    try {
      console.log('🔍 Getting all lessons from all structures...');
      const allLessons = [];
      
      // Get lessons from top-level collection
      try {
        const topLevelSnapshot = await db.collection('lessons').get();
        const topLevelLessons = topLevelSnapshot.docs.map(doc => ({
          id: doc.id,
          source: 'top-level',
          ...doc.data()
        }));
        allLessons.push(...topLevelLessons);
        console.log(`📝 Found ${topLevelLessons.length} lessons in top-level collection`);
      } catch (error) {
        console.log('⚠️ No top-level lessons collection or error accessing it');
      }
      
      // Get lessons from nested structures
      try {
        const coursesSnapshot = await db.collection('courses').get();
        
        for (const courseDoc of coursesSnapshot.docs) {
          const courseId = courseDoc.id;
          
          // Check both 'modules' and 'module' subcollections
          const moduleCollections = ['modules', 'module'];
          
          for (const moduleCollection of moduleCollections) {
            try {
              const modulesSnapshot = await db
                .collection('courses')
                .doc(courseId)
                .collection(moduleCollection)
                .get();
              
              for (const moduleDoc of modulesSnapshot.docs) {
                const moduleId = moduleDoc.id;
                
                try {
                  const lessonsSnapshot = await db
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
                    console.log(`📝 Found ${nestedLessons.length} lessons in ${courseId}/${moduleCollection}/${moduleId}`);
                  }
                } catch (lessonError) {
                  // Skip if lessons subcollection doesn't exist
                }
              }
            } catch (moduleError) {
              // Skip if module collection doesn't exist
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Error accessing nested lesson structures:', error.message);
      }
      
      // Remove duplicates based on lesson ID and moduleId combination
      const uniqueLessons = allLessons.filter((lesson, index, self) => 
        index === self.findIndex(l => 
          l.id === lesson.id && (l.moduleId || '') === (lesson.moduleId || '')
        )
      );
      
      console.log(`📚 Retrieved ${uniqueLessons.length} total unique lessons from all sources`);
      return uniqueLessons;
    } catch (error) {
      console.error('❌ Error getting all lessons:', error.message);
      throw new Error('Failed to retrieve lessons from database');
    }
  }

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
  static async getModuleById(moduleId) {
    try {
      console.log('🔍 Getting module by ID:', moduleId);
      
      // Extract course ID from module ID (e.g., "python_module_1" -> "python_course")
      const courseId = moduleId.split('_')[0] + '_course';
      console.log('📚 Looking for module in course:', courseId);

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
      
      console.log('❌ Module not found:', moduleId);
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

  // Enhanced method for getting lessons by course and module
  static async getLessonsByCourseAndModule(courseId, moduleId) {
    try {
      console.log(`🔍 Getting lessons for course ${courseId} and module ${moduleId}`);
      
      // Try both module collection naming conventions
      const moduleCollections = ['modules', 'module'];
      
      for (const moduleCollection of moduleCollections) {
        try {
          // Verify the module exists first
          const moduleDoc = await db
            .collection('courses')
            .doc(courseId)
            .collection(moduleCollection)
            .doc(moduleId)
            .get();

          if (moduleDoc.exists) {
            const lessonsSnapshot = await db
              .collection('courses')
              .doc(courseId)
              .collection(moduleCollection)
              .doc(moduleId)
              .collection('lessons')
              .get();
            
            const lessons = lessonsSnapshot.docs.map(doc => ({
              id: doc.id,
              source: `${moduleCollection}-nested`,
              ...doc.data()
            }));

            // Sort by order if available
            lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            console.log(`📝 Retrieved ${lessons.length} lessons from ${courseId}/${moduleCollection}/${moduleId}`);
            return lessons;
          }
        } catch (error) {
          console.log(`⚠️ Error checking ${moduleCollection}:`, error.message);
        }
      }
      
      console.log(`❌ Module ${moduleId} not found in course ${courseId}`);
      return [];
    } catch (error) {
      console.error('❌ Error getting lessons by course and module:', error.message);
      throw new Error('Failed to retrieve lessons for course and module');
    }
  }

  // Enhanced debug method to analyze database structure
  static async debugAnalyzeStructure() {
    try {
      console.log('🔍 Analyzing database structure...');
      const analysis = {
        courses: {},
        topLevelLessons: 0,
        nestedLessons: 0,
        moduleCollections: new Set(),
        lessonSources: new Set()
      };
      
      // Analyze courses and their modules
      const coursesSnapshot = await db.collection('courses').get();
      
      for (const courseDoc of coursesSnapshot.docs) {
        const courseId = courseDoc.id;
        analysis.courses[courseId] = {
          modules: {},
          moduleCollections: []
        };
        
        // Check both module collection types
        const moduleCollections = ['modules', 'module'];
        
        for (const moduleCollection of moduleCollections) {
          try {
            const modulesSnapshot = await db
              .collection('courses')
              .doc(courseId)
              .collection(moduleCollection)
              .get();
            
            if (modulesSnapshot.size > 0) {
              analysis.courses[courseId].moduleCollections.push(moduleCollection);
              analysis.moduleCollections.add(moduleCollection);
              
              for (const moduleDoc of modulesSnapshot.docs) {
                const moduleId = moduleDoc.id;
                
                try {
                  const lessonsSnapshot = await db
                    .collection('courses')
                    .doc(courseId)
                    .collection(moduleCollection)
                    .doc(moduleId)
                    .collection('lessons')
                    .get();
                  
                  analysis.courses[courseId].modules[moduleId] = {
                    collection: moduleCollection,
                    lessons: lessonsSnapshot.size
                  };
                  
                  analysis.nestedLessons += lessonsSnapshot.size;
                  analysis.lessonSources.add(`nested-${moduleCollection}`);
                } catch (lessonError) {
                  analysis.courses[courseId].modules[moduleId] = {
                    collection: moduleCollection,
                    lessons: 0,
                    error: 'No lessons subcollection'
                  };
                }
              }
            }
          } catch (moduleError) {
            // Collection doesn't exist
          }
        }
      }
      
      // Count top-level lessons
      try {
        const topLevelSnapshot = await db.collection('lessons').get();
        analysis.topLevelLessons = topLevelSnapshot.size;
        if (topLevelSnapshot.size > 0) {
          analysis.lessonSources.add('top-level');
        }
      } catch (error) {
        analysis.topLevelLessons = 0;
      }
      
      console.log('📊 Database Structure Analysis:', {
        totalCourses: Object.keys(analysis.courses).length,
        moduleCollectionTypes: Array.from(analysis.moduleCollections),
        lessonSources: Array.from(analysis.lessonSources),
        topLevelLessons: analysis.topLevelLessons,
        nestedLessons: analysis.nestedLessons,
        totalLessons: analysis.topLevelLessons + analysis.nestedLessons
      });
      
      return analysis;
    } catch (error) {
      console.error('❌ Error analyzing structure:', error.message);
      throw new Error('Failed to analyze database structure');
    }
  }

  // Legacy method - kept for backward compatibility but now uses hybrid approach
  static async debugListAllModules() {
    console.log('⚠️ debugListAllModules is deprecated, use getAllModules() instead');
    return this.getAllModules();
  }
}

// Export the class
module.exports = FirestoreServices;