const { initializeFirebase, admin } = require('../../config/firebase-config');

// Initialize Firebase and get db instance
const db = initializeFirebase();

class CoursesService {
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

  // Get course by ID
  static async getCourseById(courseId) {
    try {
      const courseDoc = await db.collection('courses').doc(courseId).get();
      
      if (!courseDoc.exists) {
        return null;
      }
      
      const courseData = courseDoc.data();
      
      return {
        id: courseDoc.id,
        courseId: courseData.courseId || courseDoc.id,
        courseName: courseData.courseName,
        description: courseData.description || 'No description available',
        enrolledUsers: courseData.enrolledUsers || []
      };
    } catch (error) {
      console.error('❌ Error getting course by ID:', error);
      throw new Error('Failed to find course');
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

  // Update course
  static async updateCourse(courseId, updateData) {
    try {
      const courseRef = db.collection('courses').doc(courseId);
      const courseDoc = await courseRef.get();
      
      if (!courseDoc.exists) {
        throw new Error('Course not found');
      }
      
      const updatedData = {
        ...updateData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await courseRef.update(updatedData);
      
      console.log(`✅ Updated course: ${courseId}`);
      return {
        id: courseId,
        ...courseDoc.data(),
        ...updatedData
      };
    } catch (error) {
      console.error('❌ Error updating course:', error);
      throw new Error(error.message || 'Failed to update course');
    }
  }

  // Delete course
  static async deleteCourse(courseId) {
    try {
      const courseRef = db.collection('courses').doc(courseId);
      const courseDoc = await courseRef.get();
      
      if (!courseDoc.exists) {
        throw new Error('Course not found');
      }
      
      await courseRef.delete();
      
      console.log(`✅ Deleted course: ${courseId}`);
      return { success: true, message: 'Course deleted successfully' };
    } catch (error) {
      console.error('❌ Error deleting course:', error);
      throw new Error(error.message || 'Failed to delete course');
    }
  }

  // Add user to course enrollment list
  static async addUserToCourse(courseId, userEmail) {
    try {
      const courseRef = db.collection('courses').doc(courseId);
      const courseDoc = await courseRef.get();
      
      if (!courseDoc.exists) {
        throw new Error('Course not found');
      }
      
      const courseData = courseDoc.data();
      const enrolledUsers = courseData.enrolledUsers || [];
      
      if (enrolledUsers.includes(userEmail)) {
        throw new Error('User is already enrolled in this course');
      }
      
      const updatedEnrolledUsers = [...enrolledUsers, userEmail];
      
      await courseRef.update({
        enrolledUsers: updatedEnrolledUsers,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Added user ${userEmail} to course ${courseId}`);
      return { success: true, message: 'User added to course successfully' };
    } catch (error) {
      console.error('❌ Error adding user to course:', error);
      throw new Error(error.message || 'Failed to add user to course');
    }
  }

  // Remove user from course enrollment list
  static async removeUserFromCourse(courseId, userEmail) {
    try {
      const courseRef = db.collection('courses').doc(courseId);
      const courseDoc = await courseRef.get();
      
      if (!courseDoc.exists) {
        throw new Error('Course not found');
      }
      
      const courseData = courseDoc.data();
      const enrolledUsers = courseData.enrolledUsers || [];
      
      const updatedEnrolledUsers = enrolledUsers.filter(email => email !== userEmail);
      
      await courseRef.update({
        enrolledUsers: updatedEnrolledUsers,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Removed user ${userEmail} from course ${courseId}`);
      return { success: true, message: 'User removed from course successfully' };
    } catch (error) {
      console.error('❌ Error removing user from course:', error);
      throw new Error(error.message || 'Failed to remove user from course');
    }
  }

  // Get enrolled users for a course
  static async getEnrolledUsers(courseId) {
    try {
      const courseDoc = await db.collection('courses').doc(courseId).get();
      
      if (!courseDoc.exists) {
        throw new Error('Course not found');
      }
      
      const courseData = courseDoc.data();
      return courseData.enrolledUsers || [];
    } catch (error) {
      console.error('❌ Error getting enrolled users:', error);
      throw new Error('Failed to retrieve enrolled users');
    }
  }
}

module.exports = CoursesService;