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

// api.js - Utility functions for API calls

const API_BASE_URL = 'http://localhost:3001/api';

// Generic API call function
export const apiCall = async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    };

    try {
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('❌ API call failed:', error);
        throw error;
    }
};

// Initialize Firebase (if needed)
let firebaseInitialized = false;

export const initializeFirebase = async () => {
    if (firebaseInitialized) {
        return;
    }

    try {
        // Import Firebase dynamically only if needed
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        
        // Your Firebase config
        const firebaseConfig = {
            // Add your Firebase config here if needed
            // We're moving away from direct Firebase usage, so this might not be needed
        };

        // Initialize Firebase only if config is provided
        if (Object.keys(firebaseConfig).length > 0) {
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            firebaseInitialized = true;
            return db;
        }
    } catch (error) {
        console.warn('⚠️ Firebase initialization skipped:', error);
    }
    
    return null;
};

// Export a function to get Firebase instance if needed
export const getFirebaseInstance = async () => {
    if (!firebaseInitialized) {
        await initializeFirebase();
    }
    return null; // Return null since we're using the backend API instead
}; 