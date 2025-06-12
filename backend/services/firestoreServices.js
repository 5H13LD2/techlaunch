const { db, admin } = require('./firebase-config');

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
}

module.exports = FirestoreServices;