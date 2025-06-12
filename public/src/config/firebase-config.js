// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyBgM7c1GJVvQc8FtYwgTvwqhfKAv4DLpFM",
    authDomain: "capstone-27c33.firebaseapp.com",
    projectId: "capstone-27c33",
    storageBucket: "capstone-27c33.appspot.com",
    messagingSenderId: "599725599274",
    appId: "1:599725599274:web:a1c3665539a4bd809ce2fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// API Base URL for backend
const API_BASE_URL = 'http://localhost:3000/api';

// API Functions
export const api = {
    // Users
    async getUsers() {
        const response = await fetch(`${API_BASE_URL}/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    async createUser(userData) {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Failed to create user');
        return response.json();
    },

    // Courses
    async getCourses() {
        const response = await fetch(`${API_BASE_URL}/courses`);
        if (!response.ok) throw new Error('Failed to fetch courses');
        return response.json();
    },

    async createCourse(courseData) {
        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
        });
        if (!response.ok) throw new Error('Failed to create course');
        return response.json();
    },

    // Enrollments
    async enrollUser(enrollmentData) {
        const response = await fetch(`${API_BASE_URL}/enrollments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrollmentData)
        });
        if (!response.ok) throw new Error('Failed to enroll user');
        return response.json();
    }
};

export { app, db, auth }; 