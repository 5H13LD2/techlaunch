const { initializeFirebase, admin } = require('../../config/firebase-config');
const logger = require('../../utils/logger');

// Initialize Firebase and get db instance
const db = initializeFirebase();

const ENROLLMENT_COLLECTION = 'enrollments';

class EnrollmentService {
    constructor() {
        this.db = db;
        this.admin = admin;
        this.logger = logger.child({ service: 'EnrollmentService' });
    }

    // Get all enrollments
    async getAll() {
        try {
            const snapshot = await this.db.collection(ENROLLMENT_COLLECTION).get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            this.logger.error('Error fetching all enrollments:', error);
            throw new Error('Failed to fetch enrollments');
        }
    }

    // Get enrollment by ID
    async getById(enrollmentId) {
        try {
            const doc = await this.db.collection(ENROLLMENT_COLLECTION).doc(enrollmentId).get();
            if (!doc.exists) {
                return null;
            }
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            this.logger.error(`Error fetching enrollment ${enrollmentId}:`, error);
            throw new Error('Failed to fetch enrollment');
        }
    }

    // Create new enrollment
    async create(enrollmentData) {
        try {
            const enrollment = {
                ...enrollmentData,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: enrollmentData.status || 'active'
            };

            const docRef = await this.db.collection(ENROLLMENT_COLLECTION).add(enrollment);
            const createdEnrollment = await this.getById(docRef.id);
            
            this.logger.info(`Enrollment created with ID: ${docRef.id}`);
            return createdEnrollment;
        } catch (error) {
            this.logger.error('Error creating enrollment:', error);
            throw new Error('Failed to create enrollment');
        }
    }

    // Update enrollment
    async update(enrollmentId, updateData) {
        try {
            const updatePayload = {
                ...updateData,
                updatedAt: new Date()
            };

            await this.db.collection(ENROLLMENT_COLLECTION).doc(enrollmentId).update(updatePayload);
            const updatedEnrollment = await this.getById(enrollmentId);
            
            this.logger.info(`Enrollment updated: ${enrollmentId}`);
            return updatedEnrollment;
        } catch (error) {
            this.logger.error(`Error updating enrollment ${enrollmentId}:`, error);
            throw new Error('Failed to update enrollment');
        }
    }

    // Delete enrollment
    async delete(enrollmentId) {
        try {
            await this.db.collection(ENROLLMENT_COLLECTION).doc(enrollmentId).delete();
            this.logger.info(`Enrollment deleted: ${enrollmentId}`);
            return true;
        } catch (error) {
            this.logger.error(`Error deleting enrollment ${enrollmentId}:`, error);
            throw new Error('Failed to delete enrollment');
        }
    }

    // Get enrollments by user
    async getByUser(userId) {
        try {
            const snapshot = await this.db.collection(ENROLLMENT_COLLECTION)
                .where('userId', '==', userId)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            this.logger.error(`Error fetching enrollments for user ${userId}:`, error);
            throw new Error('Failed to fetch user enrollments');
        }
    }

    // Get enrollments by course
    async getByCourse(courseId) {
        try {
            const snapshot = await this.db.collection(ENROLLMENT_COLLECTION)
                .where('courseId', '==', courseId)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            this.logger.error(`Error fetching enrollments for course ${courseId}:`, error);
            throw new Error('Failed to fetch course enrollments');
        }
    }
}

module.exports = new EnrollmentService(); 