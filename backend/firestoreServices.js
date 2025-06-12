const { db } = require('./config/firebase-admin');

class FirestoreServices {
    // User operations
    static async getAllUsers() {
        try {
            const usersSnapshot = await db.collection('users').get();
            const users = [];
            usersSnapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            return users;
        } catch (error) {
            console.error('Error getting users:', error);
            throw new Error('Failed to retrieve users');
        }
    }

    static async createUser({ userId, username, email }) {
        try {
            // Check if user already exists
            const existingUser = await db.collection('users')
                .where('email', '==', email)
                .get();

            if (!existingUser.empty) {
                throw new Error('User already exists');
            }

            const userDoc = await db.collection('users').doc(userId).set({
                username,
                email,
                createdAt: new Date().toISOString(),
                courseTaken: [],
                isEnrolled: false
            });

            return {
                userId,
                username,
                email,
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Course operations
    static async getAllCourses() {
        try {
            const coursesSnapshot = await db.collection('courses').get();
            const courses = [];
            coursesSnapshot.forEach(doc => {
                courses.push({ id: doc.id, ...doc.data() });
            });
            return courses;
        } catch (error) {
            console.error('Error getting courses:', error);
            throw new Error('Failed to retrieve courses');
        }
    }

    static async createCourse({ courseId, courseName, description }) {
        try {
            // Check if course already exists
            const existingCourse = await db.collection('courses')
                .where('courseId', '==', courseId)
                .get();

            if (!existingCourse.empty) {
                throw new Error('Course already exists');
            }

            await db.collection('courses').doc(courseId).set({
                courseId,
                courseName,
                description,
                createdAt: new Date().toISOString(),
                enrolledUsers: []
            });

            return {
                courseId,
                courseName,
                description,
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error creating course:', error);
            throw error;
        }
    }

    // Enrollment operations
    static async enrollUserInCourse(email, courseName) {
        try {
            // Get user
            const userSnapshot = await db.collection('users')
                .where('email', '==', email)
                .get();

            if (userSnapshot.empty) {
                throw new Error('User not found');
            }

            // Get course
            const courseSnapshot = await db.collection('courses')
                .where('courseName', '==', courseName)
                .get();

            if (courseSnapshot.empty) {
                throw new Error('Course not found');
            }

            const user = userSnapshot.docs[0];
            const course = courseSnapshot.docs[0];
            const userData = user.data();

            // Check if already enrolled
            if (userData.courseTaken && userData.courseTaken.includes(course.id)) {
                throw new Error('User is already enrolled in this course');
            }

            // Update user document
            await user.ref.update({
                courseTaken: [...(userData.courseTaken || []), course.id],
                isEnrolled: true
            });

            // Update course document
            await course.ref.update({
                enrolledUsers: [...(course.data().enrolledUsers || []), user.id]
            });

            return {
                userId: user.id,
                courseId: course.id,
                enrollmentDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error enrolling user:', error);
            throw error;
        }
    }

    // Dashboard statistics
    static async getDashboardStats() {
        try {
            const [usersSnapshot, coursesSnapshot] = await Promise.all([
                db.collection('users').get(),
                db.collection('courses').get()
            ]);

            const totalUsers = usersSnapshot.size;
            const totalCourses = coursesSnapshot.size;
            
            let totalEnrollments = 0;
            coursesSnapshot.forEach(doc => {
                const course = doc.data();
                if (course.enrolledUsers) {
                    totalEnrollments += course.enrolledUsers.length;
                }
            });

            return {
                totalUsers,
                totalCourses,
                totalEnrollments,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw new Error('Failed to retrieve dashboard statistics');
        }
    }

    // Recent activity
    static async getRecentActivity() {
        try {
            const [recentUsers, recentCourses] = await Promise.all([
                db.collection('users')
                    .orderBy('createdAt', 'desc')
                    .limit(5)
                    .get(),
                db.collection('courses')
                    .orderBy('createdAt', 'desc')
                    .limit(5)
                    .get()
            ]);

            const activity = {
                recentUsers: [],
                recentCourses: []
            };

            recentUsers.forEach(doc => {
                activity.recentUsers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            recentCourses.forEach(doc => {
                activity.recentCourses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return activity;
        } catch (error) {
            console.error('Error getting recent activity:', error);
            throw new Error('Failed to retrieve recent activity');
        }
    }
}

module.exports = FirestoreServices; 