import { db, auth } from '../config/firebase-config.js';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Initialize Firebase Authentication
export const initializeAuth = async () => {
    try {
        // Add any auth initialization logic here
        console.log('Firebase Auth initialized');
    } catch (error) {
        console.error('Error initializing Firebase Auth:', error);
        throw error;
    }
};

// Generic Firestore request handler
async function firestoreRequest(collectionName, operation, data = null) {
    try {
        const collectionRef = collection(db, collectionName);
        
        switch (operation.type) {
            case 'getAll':
                const snapshot = await getDocs(collectionRef);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
            case 'getOne':
                const docRef = doc(db, collectionName, operation.id);
                const docSnap = await getDoc(docRef);
                return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
                
            case 'create':
                await setDoc(doc(collectionRef), data);
                return { ...data };
                
            case 'update':
                const updateRef = doc(db, collectionName, operation.id);
                await updateDoc(updateRef, data);
                return { id: operation.id, ...data };
                
            case 'delete':
                const deleteRef = doc(db, collectionName, operation.id);
                await deleteDoc(deleteRef);
                return { success: true };
                
            default:
                throw new Error('Invalid operation type');
        }
    } catch (error) {
        console.error(`Firestore Error (${collectionName}):`, error);
        throw error;
    }
}

// User API endpoints
export const userApi = {
    getAllUsers: () => firestoreRequest('users', { type: 'getAll' }),
    
    getUserByEmail: (email) => firestoreRequest('users', { type: 'getOne', id: email }),
    
    createUser: (userData) => firestoreRequest('users', { type: 'create' }, userData),
    
    updateUser: (userId, userData) => firestoreRequest('users', { type: 'update', id: userId }, userData),
    
    deleteUser: (userId) => firestoreRequest('users', { type: 'delete', id: userId }),
    
    getUserCourses: async (email) => {
        const q = query(collection(db, 'enrollments'), where('userEmail', '==', email));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
    }
};

// Course API endpoints
export const courseApi = {
    getAllCourses: () => firestoreRequest('courses', { type: 'getAll' }),
    
    getCourseByName: (name) => firestoreRequest('courses', { type: 'getOne', id: name }),
    
    createCourse: (courseData) => firestoreRequest('courses', { type: 'create' }, courseData),
    
    updateCourse: (courseId, courseData) => firestoreRequest('courses', { type: 'update', id: courseId }, courseData),
    
    deleteCourse: (courseId) => firestoreRequest('courses', { type: 'delete', id: courseId }),
    
    addModule: (courseId, moduleData) => firestoreRequest(`courses/${courseId}/modules`, { type: 'create' }, moduleData)
};

// Enrollment API endpoints
export const enrollmentApi = {
    enrollUser: (enrollmentData) => firestoreRequest('enrollments', { type: 'create' }, enrollmentData),
    
    getEnrollmentStats: async () => {
        const snapshot = await getDocs(collection(db, 'enrollments'));
        return {
            total: snapshot.size,
            active: snapshot.docs.filter(doc => doc.data().status === 'active').length
        };
    }
};

// Dashboard API endpoints
export const dashboardApi = {
    getStats: async () => {
        const [users, courses, enrollments] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'courses')),
            getDocs(collection(db, 'enrollments'))
        ]);
        
        return {
            totalUsers: users.size,
            totalCourses: courses.size,
            totalEnrollments: enrollments.size
        };
    }
}; 