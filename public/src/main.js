// ================
// src/utils/navigation.js
// ================
// Navigation and routing functionality
// Handles page navigation and route management

// ================
// src/app.js
// ================
// Main application entry point
// Initializes and coordinates all functionality

// Import necessary modules
import { initializeAuth } from './utils/api.js';
import { dataManager } from './utils/dataManager.js';
import { initializeNavigation } from './utils/navigation.js';
import { initializeCourseManagement } from './utils/courseManagement.js';
import { initializeModuleManagement } from './utils/moduleManagement.js';
import { initializeUserManagement } from './utils/userManagement.js';
import { showToast, handleError, updateDashboardStats } from './utils/dom.js';
import { initializeDomHandlers } from './utils/dom-handlers.js';
import { db, storage, auth } from './config/firebase-config.js';
import { signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Global state
let users = [];
let courses = [];
let currentPage = 'dashboard';
let currentCourse = null;
let currentUser = null;

// DOM Elements
const elements = {
    totalUsers: document.getElementById('total-users'),
    totalCourses: document.getElementById('total-courses'),
    totalEnrollments: document.getElementById('total-enrollments'),
    recentActivityList: document.getElementById('recent-activity-list'),
    usersTableBody: document.getElementById('users-table-body'),
    coursesGrid: document.getElementById('courses-grid'),
    userSelect: document.getElementById('user-select'),
    courseSelect: document.getElementById('course-select'),
    loadingSpinner: document.getElementById('loading-spinner'),
    toastContainer: document.getElementById('toast-container')
};

// Utility Functions
const showLoading = () => {
    if (elements.loadingSpinner) {
        elements.loadingSpinner.style.display = 'flex';
    }
};

const hideLoading = () => {
    if (elements.loadingSpinner) {
        elements.loadingSpinner.style.display = 'none';
    }
};

const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    if (!elements.toastContainer) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
        elements.toastContainer = container;
    }
    
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (elements.toastContainer && elements.toastContainer.contains(toast)) {
                elements.toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
};

// Navigation Functions
const showPage = (pageId) => {
    console.log(`Navigating to page: ${pageId}`);
    
    const validPages = ['dashboard', 'users', 'courses', 'enrollments'];
    if (!validPages.includes(pageId)) {
        console.error(`Invalid page ID: ${pageId}`);
        return;
    }
    
    currentPage = pageId;
    
    document.querySelectorAll('.page').forEach(page => {
        if (page) {
            page.style.display = 'none';
            page.classList.remove('active-page', 'active');
        }
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link) {
            link.classList.remove('active');
        }
    });
    
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';
        page.classList.add('active-page', 'active');
    }
    
    const navLink = document.querySelector(`[data-page="${pageId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    loadPageData(pageId);
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
};

// Load page-specific data
const loadPageData = (pageId) => {
    switch (pageId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsers();
            break;
        case 'courses':
            loadCourses();
            break;
        case 'enrollments':
            loadUsers();
            loadCourses();
            break;
    }
};

// Dashboard Functions
const loadDashboardData = async () => {
    try {
        showLoading();
        const [usersSnapshot, coursesSnapshot] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'courses'))
        ]);
        
        const totalUsers = usersSnapshot.size;
        const totalCourses = coursesSnapshot.size;
        const totalEnrollments = usersSnapshot.docs.reduce((sum, doc) => 
            sum + (doc.data().courseTaken?.length || 0), 0);
            
        if (elements.totalUsers) elements.totalUsers.textContent = totalUsers;
        if (elements.totalCourses) elements.totalCourses.textContent = totalCourses;
        if (elements.totalEnrollments) elements.totalEnrollments.textContent = totalEnrollments;
        
        generateRecentActivity();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
    } finally {
        hideLoading();
    }
};

const generateRecentActivity = () => {
    if (!elements.recentActivityList) return;
    
    const activities = [
        { message: 'Dashboard initialized', timestamp: new Date() },
        { message: 'Data loaded successfully', timestamp: new Date(Date.now() - 1000 * 60) }
    ];
    
    const activityHTML = activities.map(activity => `
        <div class="activity-item">
            <p>${activity.message}</p>
            <small>${activity.timestamp.toLocaleString()}</small>
        </div>
    `).join('');
    
    elements.recentActivityList.innerHTML = activityHTML;
};

// User Management Functions
const loadUsers = async () => {
    try {
        showLoading();
        const usersSnapshot = await getDocs(collection(db, 'users'));
        users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            users.push({ 
                id: doc.id, 
                ...userData,
                coursesCount: userData.courseTaken?.length || 0
            });
        });
        
        displayUsers();
        populateUserSelect();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    } finally {
        hideLoading();
    }
};

const displayUsers = () => {
    if (!elements.usersTableBody) return;
    
    const usersHTML = users.map(user => `
        <tr>
            <td>${user.email || 'N/A'}</td>
            <td>${user.username || 'N/A'}</td>
            <td>${user.coursesCount} courses</td>
            <td>
                <button class="btn btn-secondary" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    elements.usersTableBody.innerHTML = usersHTML;
};

// Course Management Functions
const loadCourses = async () => {
    try {
        showLoading();
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        courses = [];
        coursesSnapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });
        
        displayCourses();
        populateCourseSelect();
        } catch (error) {
        console.error('Error loading courses:', error);
        showToast('Failed to load courses', 'error');
    } finally {
        hideLoading();
    }
};

const displayCourses = () => {
    if (!elements.coursesGrid) return;
    
    const coursesHTML = courses.map(course => `
        <div class="course-card">
            <h3>${course.courseName || course.name || 'Untitled Course'}</h3>
            <p>${course.description || 'No description available'}</p>
            <div class="course-info">
                <strong>Course ID:</strong> ${course.courseId || course.id}<br>
                <strong>Enrolled Users:</strong> ${(course.enrolledUsers || []).length}
            </div>
            <div class="course-actions">
                <button class="btn btn-primary" onclick="viewModules('${course.id}')">
                    <i class="fas fa-cubes"></i> View Modules
                </button>
                <button class="btn btn-secondary" onclick="editCourse('${course.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="removeCourse('${course.id}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
    
    elements.coursesGrid.innerHTML = coursesHTML;
};

// Initialize the application
const initializeApp = async () => {
    try {
        // Initialize Firebase Auth anonymously for demo purposes
        await signInAnonymously(auth);
        
        // Initialize all modules
        await Promise.all([
            initializeAuth(),
            initializeNavigation(),
            initializeCourseManagement(),
            initializeModuleManagement(),
            initializeUserManagement(),
            initializeDomHandlers()
        ]);
        
        // Set up auth state observer
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('Anonymous user signed in');
            } else {
                console.log('User signed out');
            }
        });
        
        showToast('Application initialized successfully', 'success');
    } catch (error) {
        console.error('Error initializing app:', error);
        handleError(error);
    }
};

// Set up event listeners
const setupEventListeners = () => {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            if (pageId) {
                showPage(pageId);
            }
        });
    });
    
    // Forms
    document.getElementById('create-user-form')?.addEventListener('submit', handleCreateUser);
    document.getElementById('create-course-form')?.addEventListener('submit', handleCreateCourse);
    
    // Mobile sidebar toggle
    document.getElementById('toggleBtn')?.addEventListener('click', toggleSidebar);
};

// Form handlers
const handleCreateUser = async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('new-username')?.value;
    const email = document.getElementById('new-email')?.value;
    
    if (!username || !email) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        showLoading();
        const userData = {
            username,
            email,
            createdAt: new Date().toISOString(),
            courseTaken: [],
            isEnrolled: false
        };
        
        await addDoc(collection(db, 'users'), userData);
        showToast('User created successfully');
        closeModal('create-user-modal');
        loadUsers();
    } catch (error) {
        console.error('Error creating user:', error);
        showToast('Failed to create user', 'error');
    } finally {
        hideLoading();
    }
};

const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    const courseId = document.getElementById('new-course-id')?.value;
    const courseName = document.getElementById('new-course-name')?.value;
    const description = document.getElementById('new-course-description')?.value;
    
    if (!courseId || !courseName) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showLoading();
        const courseData = {
            courseId,
            courseName,
            description: description || '',
            createdAt: new Date().toISOString(),
            enrolledUsers: []
        };
        
        await addDoc(collection(db, 'courses'), courseData);
        showToast('Course created successfully');
        closeModal('create-course-modal');
        loadCourses();
    } catch (error) {
        console.error('Error creating course:', error);
        showToast('Failed to create course', 'error');
    } finally {
        hideLoading();
    }
};

// Helper functions
const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
};

const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

const populateUserSelect = () => {
    if (!elements.userSelect) return;
    
    const options = users.map(user => 
        `<option value="${user.email}">${user.username} (${user.email})</option>`
    ).join('');
    
    elements.userSelect.innerHTML = '<option value="">Select User</option>' + options;
};

const populateCourseSelect = () => {
    if (!elements.courseSelect) return;
    
    const options = courses.map(course => 
        `<option value="${course.id}">${course.courseName || course.name}</option>`
    ).join('');
    
    elements.courseSelect.innerHTML = '<option value="">Select Course</option>' + options;
};

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export any necessary functions or variables
export {
    initializeApp
};

// Export functions for global access
window.showPage = showPage;
window.toggleSidebar = toggleSidebar;
window.closeModal = closeModal;
window.editUser = (userId) => console.log('Edit user:', userId);
window.deleteUser = (userId) => console.log('Delete user:', userId);
window.viewModules = (courseId) => console.log('View modules:', courseId);
window.editCourse = (courseId) => console.log('Edit course:', courseId);
window.removeCourse = (courseId) => console.log('Remove course:', courseId);