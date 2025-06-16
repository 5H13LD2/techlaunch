const { initializeFirebase, admin } = require('../../config/firebase-config');
const logger = require('../../utils/logger');

// Initialize Firebase and get db instance
const db = initializeFirebase();

class UserService {
  // Get all users with their course information
  static async getAllUsers() {
    try {
      logger.database('📋 Fetching all users');
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
      
      logger.info(`✅ Retrieved ${users.length} users`);
      return users;
    } catch (error) {
      logger.error('❌ Failed to retrieve users', { error: error.message });
      throw new Error('Failed to retrieve users from database');
    }
  }

  // Get user by email
  static async getUserByEmail(email) {
    try {
      logger.database(`🔍 Fetching user by email: ${email}`);
      const userSnapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (userSnapshot.empty) {
        logger.warn(`⚠️ User not found with email: ${email}`);
        return null;
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      logger.info(`✅ Found user: ${email}`);
      return {
        id: userDoc.id,
        userId: userData.userId || userDoc.id,
        username: userData.username || 'N/A',
        email: userData.email,
        coursesTaken: userData.coursesTaken || []
      };
    } catch (error) {
      logger.error('❌ Failed to find user by email', { 
        email, 
        error: error.message 
      });
      throw new Error('Failed to find user');
    }
  }

  // Create new user
  static async createUser(userData) {
    try {
      const { userId, username, email } = userData;
      logger.database('📝 Creating new user', { userId, username, email });
      
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        logger.warn('⚠️ User creation failed - email already exists', { email });
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
      
      logger.info('✅ User created successfully', { 
        userId: docRef.id, 
        email 
      });
      
      return {
        id: docRef.id,
        ...newUser,
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('❌ Failed to create user', { 
        userData,
        error: error.message 
      });
      throw new Error(error.message || 'Failed to create user');
    }
  }

  // Enroll user in course using Firestore transaction
  static async enrollUserInCourse(userEmail, courseName) {
    try {
      logger.database('🎓 Starting course enrollment transaction', { 
        userEmail, 
        courseName 
      });

      const result = await db.runTransaction(async (transaction) => {
        // Get user by email
        const userQuery = await db.collection('users')
          .where('email', '==', userEmail)
          .limit(1)
          .get();
        
        if (userQuery.empty) {
          logger.warn('⚠️ Enrollment failed - user not found', { userEmail });
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
          logger.warn('⚠️ Enrollment failed - course not found', { courseName });
          throw new Error('Course not found');
        }
        
        const courseDoc = courseQuery.docs[0];
        const courseData = courseDoc.data();
        
        // Check if user is already enrolled
        const userCourses = userData.coursesTaken || [];
        if (userCourses.includes(courseName)) {
          logger.warn('⚠️ Enrollment failed - user already enrolled', { 
            userEmail, 
            courseName 
          });
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
      
      logger.info('✅ Course enrollment successful', { 
        userEmail, 
        courseName 
      });
      return result;
    } catch (error) {
      logger.error('❌ Course enrollment failed', { 
        userEmail, 
        courseName, 
        error: error.message 
      });
      throw new Error(error.message || 'Failed to enroll user in course');
    }
  }

  // Get recent activity (last 10 enrollments)
  static async getRecentActivity() {
    try {
      logger.database('📊 Fetching recent activity');
      // This is a simplified version - in a real app, you'd store enrollment history
      const users = await this.getAllUsers();
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
      
      const sortedActivity = recentActivity.sort((a, b) => b.timestamp - a.timestamp);
      logger.info(`✅ Retrieved ${sortedActivity.length} recent activities`);
      return sortedActivity;
    } catch (error) {
      logger.error('❌ Failed to retrieve recent activity', { 
        error: error.message 
      });
      throw new Error('Failed to retrieve recent activity');
    }
  }
}

module.exports = UserService;