// ================
// DataManager.js
// ================
// Global data state management and synchronization
// Handles all data operations and maintains application state

import { db } from '../config/firebase-config.js';
import { collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { showToast, showLoading, hideLoading } from './dom.js';

// Global state variables
let users = [];
let courses = [];
let currentPage = 'dashboard';
let currentCourse = null;
let currentModule = null;

/**
 * Data Manager Class
 * Centralized data management for the admin dashboard
 */
class DataManager {
    constructor() {
        this.initializeState();
    }

    /**
     * Initialize application state
     */
    initializeState() {
        this.resetState();
    }

    /**
     * Reset all state variables
     */
    resetState() {
        users.length = 0;
        courses.length = 0;
        currentPage = 'dashboard';
        currentCourse = null;
        currentModule = null;
    }

    /**
     * Load all users from Firestore
     * @returns {Promise<Array>} Array of users
     */
    async loadUsers() {
        try {
            showLoading();
            const usersSnapshot = await getDocs(collection(db, 'users'));
            
            // Process user data to ensure consistent structure
            users.length = 0; // Clear existing array
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    email: userData.email || 'N/A',
                    username: userData.username || 'N/A',
                    courseTaken: userData.courseTaken || [],
                    coursesTaken: userData.coursesTaken || userData.courseTaken || [],
                    isEnrolled: userData.isEnrolled || false,
                    createdAt: userData.createdAt || new Date().toISOString(),
                    lastEnrollmentTime: userData.lastEnrollmentTime || null
                });
            });

            console.log(`Loaded ${users.length} users`);
            showToast(`Successfully loaded ${users.length} users`);
            return users;
        } catch (error) {
            console.error('Error loading users:', error);
            showToast('Failed to load users', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Load all courses from Firestore
     * @returns {Promise<Array>} Array of courses
     */
    async loadCourses() {
        try {
            showLoading();
            const coursesSnapshot = await getDocs(collection(db, 'courses'));
            
            // Process course data to ensure consistent structure
            courses.length = 0; // Clear existing array
            coursesSnapshot.forEach(doc => {
                const courseData = doc.data();
                courses.push({
                    id: doc.id,
                    courseId: courseData.courseId || doc.id,
                    courseName: courseData.courseName || courseData.name || 'Untitled Course',
                    name: courseData.name || courseData.courseName || 'Untitled Course',
                    description: courseData.description || 'No description available',
                    enrolledUsers: courseData.enrolledUsers || [],
                    createdAt: courseData.createdAt || new Date().toISOString(),
                    moduleCount: 0 // Will be populated when modules are loaded
                });
            });

            console.log(`Loaded ${courses.length} courses`);
            showToast(`Successfully loaded ${courses.length} courses`);
            return courses;
        } catch (error) {
            console.error('Error loading courses:', error);
            showToast('Failed to load courses', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Load modules for a specific course
     * @param {string} courseId - Course ID
     * @returns {Promise<Array>} Array of modules
     */
    async loadModules(courseId) {
        try {
            showLoading();
            if (!courseId) {
                throw new Error('Course ID is required');
            }

            const modulesSnapshot = await getDocs(query(collection(db, 'courses', courseId, 'modules'), orderBy('order')));
            
            // Sort modules by order if available
            const modules = [];
            modulesSnapshot.forEach(doc => {
                const moduleData = doc.data();
                modules.push({
                    id: doc.id,
                    title: moduleData.title || 'Untitled Module',
                    description: moduleData.description || 'No description available',
                    order: moduleData.order || 0,
                    content: moduleData.content || '',
                    videoUrl: moduleData.videoUrl || '',
                    duration: moduleData.duration || 0,
                    isPublished: moduleData.isPublished || false
                });
            });

            console.log(`Loaded ${modules.length} modules for course ${courseId}`);
            return modules;
        } catch (error) {
            console.error('Error loading modules:', error);
            showToast('Failed to load modules', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        try {
            showLoading();
            
            // Validate required fields
            if (!userData.email || !userData.username) {
                throw new Error('Email and username are required');
            }

            // Check if user already exists
            const existingUser = users.find(user => user.email === userData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            const newUser = {
                username: userData.username,
                email: userData.email,
                courseTaken: [],
                coursesTaken: [],
                isEnrolled: false,
                lastEnrollmentTime: null
            };

            const createdUser = await addDoc(collection(db, 'users'), newUser);
            
            // Add to local state
            users.push({ ...newUser, id: createdUser.id });
            
            showToast('User created successfully');
            return { ...newUser, id: createdUser.id };
        } catch (error) {
            console.error('Error creating user:', error);
            if (error.message.includes('already exists')) {
                showToast(error.message, 'error');
            } else {
                showToast('Failed to create user', 'error');
            }
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Create a new course
     * @param {Object} courseData - Course data
     * @returns {Promise<Object>} Created course
     */
    async createCourse(courseData) {
        try {
            showLoading();
            
            // Validate required fields
            if (!courseData.courseName || !courseData.description) {
                throw new Error('Course name and description are required');
            }

            // Check if course already exists
            const existingCourse = courses.find(course => 
                course.courseName === courseData.courseName || 
                course.courseId === courseData.courseId
            );
            if (existingCourse) {
                throw new Error('Course with this name already exists');
            }

            const newCourse = {
                courseId: courseData.courseId || `course_${Date.now()}`,
                courseName: courseData.courseName,
                name: courseData.courseName, // For compatibility
                description: courseData.description,
                enrolledUsers: []
            };

            const createdCourse = await addDoc(collection(db, 'courses'), newCourse);
            
            // Add to local state
            courses.push({ ...newCourse, id: createdCourse.id });
            
            showToast('Course created successfully');
            return { ...newCourse, id: createdCourse.id };
        } catch (error) {
            console.error('Error creating course:', error);
            if (error.message.includes('already exists')) {
                showToast(error.message, 'error');
            } else {
                showToast('Failed to create course', 'error');
            }
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Create a new module for a course
     * @param {string} courseId - Course ID
     * @param {Object} moduleData - Module data
     * @returns {Promise<Object>} Created module
     */
    async createModule(courseId, moduleData) {
        try {
            showLoading();
            
            if (!courseId) {
                throw new Error('Course ID is required');
            }

            if (!moduleData.title || !moduleData.description) {
                throw new Error('Module title and description are required');
            }

            const newModule = {
                title: moduleData.title,
                description: moduleData.description,
                order: moduleData.order || 0,
                content: moduleData.content || '',
                videoUrl: moduleData.videoUrl || '',
                duration: moduleData.duration || 0,
                isPublished: moduleData.isPublished || false
            };

            // Add module to course subcollection
            const createdModule = await addDoc(collection(db, 'courses', courseId, 'modules'), newModule);
            
            showToast('Module created successfully');
            return { ...newModule, id: createdModule.id };
        } catch (error) {
            console.error('Error creating module:', error);
            showToast('Failed to create module', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Update an existing course
     * @param {string} courseId - Course ID
     * @param {Object} courseData - Updated course data
     * @returns {Promise<Object>} Updated course
     */
    async updateCourse(courseId, courseData) {
        try {
            showLoading();
            
            if (!courseId) {
                throw new Error('Course ID is required');
            }

            const updatedCourse = await updateDoc(doc(db, 'courses', courseId));
            
            // Update local state
            const index = courses.findIndex(course => course.id === courseId);
            if (index !== -1) {
                courses[index] = { ...courses[index], ...courseData };
            }
            
            showToast('Course updated successfully');
            return { ...courseData, id: courseId };
        } catch (error) {
            console.error('Error updating course:', error);
            showToast('Failed to update course', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Update an existing module
     * @param {string} courseId - Course ID
     * @param {string} moduleId - Module ID
     * @param {Object} moduleData - Updated module data
     * @returns {Promise<Object>} Updated module
     */
    async updateModule(courseId, moduleId, moduleData) {
        try {
            showLoading();
            
            if (!courseId || !moduleId) {
                throw new Error('Course ID and Module ID are required');
            }

            const updatedModule = await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId));
            
            showToast('Module updated successfully');
            return { ...moduleData, id: moduleId };
        } catch (error) {
            console.error('Error updating module:', error);
            showToast('Failed to update module', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Delete a user
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteUser(userId) {
        try {
            showLoading();
            
            if (!userId) {
                throw new Error('User ID is required');
            }

            await deleteDoc(doc(db, 'users', userId));
            
            // Remove from local state
            const index = users.findIndex(user => user.id === userId);
            if (index !== -1) {
                users.splice(index, 1);
            }
            
            showToast('User deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast('Failed to delete user', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Delete a course
     * @param {string} courseId - Course ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteCourse(courseId) {
        try {
            showLoading();
            
            if (!courseId) {
                throw new Error('Course ID is required');
            }

            await deleteDoc(doc(db, 'courses', courseId));
            
            // Remove from local state
            const index = courses.findIndex(course => course.id === courseId);
            if (index !== -1) {
                courses.splice(index, 1);
            }
            
            showToast('Course deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast('Failed to delete course', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Delete a module
     * @param {string} courseId - Course ID
     * @param {string} moduleId - Module ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteModule(courseId, moduleId) {
        try {
            showLoading();
            
            if (!courseId || !moduleId) {
                throw new Error('Course ID and Module ID are required');
            }

            await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId));
            
            showToast('Module deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting module:', error);
            showToast('Failed to delete module', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    /**
     * Get dashboard statistics
     * @returns {Object} Dashboard stats
     */
    getDashboardStats() {
        const totalEnrollments = users.reduce((sum, user) => 
            sum + (user.coursesTaken?.length || user.courseTaken?.length || 0), 0
        );

        return {
            totalUsers: users.length,
            totalCourses: courses.length,
            totalEnrollments: totalEnrollments,
            recentActivity: this.generateRecentActivity()
        };
    }

    /**
     * Generate recent activity from current data
     * @returns {Array} Recent activity items
     */
    generateRecentActivity() {
        const activities = [];
        
        // Generate activity based on users with courses
        users.slice(0, 3).forEach((user, index) => {
            const userCourses = user.coursesTaken || user.courseTaken || [];
            if (userCourses.length > 0) {
                activities.push({
                    message: `${user.username} enrolled in ${userCourses[userCourses.length - 1]}`,
                    timestamp: new Date(Date.now() - (index + 1) * 2 * 60 * 60 * 1000),
                    type: 'enrollment'
                });
            }
        });
        
        // Add course creation activities
        courses.slice(-2).forEach((course, index) => {
            activities.push({
                message: `Course "${course.courseName}" was created`,
                timestamp: new Date(course.createdAt || Date.now() - (index + 4) * 60 * 60 * 1000),
                type: 'course_creation'
            });
        });
        
        // Add some generic activities if no data
        if (activities.length === 0) {
            activities.push(
                { 
                    message: 'Dashboard initialized', 
                    timestamp: new Date(Date.now() - 30 * 60 * 1000),
                    type: 'system'
                },
                { 
                    message: 'System health check completed', 
                    timestamp: new Date(Date.now() - 60 * 60 * 1000),
                    type: 'system'
                }
            );
        }
        
        // Sort by timestamp (newest first)
        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Search and filter functions
     */
    searchUsers(searchTerm) {
        if (!searchTerm) return users;
        
        const term = searchTerm.toLowerCase();
        return users.filter(user => 
            user.username.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            (user.coursesTaken || user.courseTaken || []).some(course => 
                course.toLowerCase().includes(term)
            )
        );
    }

    searchCourses(searchTerm) {
        if (!searchTerm) return courses;
        
        const term = searchTerm.toLowerCase();
        return courses.filter(course => 
            course.courseName.toLowerCase().includes(term) ||
            course.description.toLowerCase().includes(term) ||
            course.courseId.toLowerCase().includes(term)
        );
    }
}

// Create singleton instance
export const dataManager = new DataManager();

// State getters
export const getCurrentPage = () => currentPage;
export const getCurrentCourse = () => currentCourse;
export const getCurrentModule = () => currentModule;
export const getUsers = () => users;
export const getCourses = () => courses;

// State setters
export const setCurrentPage = (page) => { currentPage = page; };
export const setCurrentCourse = (courseId) => { currentCourse = courseId; };
export const setCurrentModule = (moduleId) => { currentModule = moduleId; };