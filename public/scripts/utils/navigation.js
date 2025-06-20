// ================
// src/utils/navigation.js
// ================
// Navigation and routing functionality
// Handles page navigation and route management

import { dataManager } from './dataManager.js';
import { showElement, hideElement, updateDashboardStats, handleError, showPage, toggleSidebar, closeModal } from './dom.js';
import { fetchDashboardStats, fetchRecentActivity, fetchUsers, fetchCourses } from './dataManager.js';
import { showCreateUserModal } from './userManagement.js';
import { showCreateCourseModal, enrollUser } from './courseManagement.js';
import { filterUsers } from './dataManager.js';

// Available routes and their configurations
const routes = {
    dashboard: {
        path: '#/dashboard',
        element: 'dashboard-page',
        title: 'Dashboard',
        load: async () => {
            try {
                const stats = dataManager.getDashboardStats();
                updateDashboardStats(stats);
            } catch (error) {
                handleError(error);
            }
        }
    },
    users: {
        path: '#/users',
        element: 'users-page',
        title: 'Users',
        load: async () => {
            try {
                await dataManager.loadUsers();
            } catch (error) {
                handleError(error);
            }
        }
    },
    courses: {
        path: '#/courses',
        element: 'courses-page',
        title: 'Courses',
        load: async () => {
            try {
                await dataManager.loadCourses();
            } catch (error) {
                handleError(error);
            }
        }
    },
    modules: {
        path: '#/modules/:courseId',
        element: 'modules-page',
        title: 'Course Modules',
        load: async (params) => {
            try {
                if (params.courseId) {
                    await dataManager.loadModules(params.courseId);
                    document.getElementById('modules-course-title').textContent = `Modules for Course: ${params.courseId}`;
                } else {
                    console.warn('No courseId provided for modules route.');
                }
            } catch (error) {
                handleError(error);
            }
        }
    },
    enrollments: {
        path: '#/enrollments',
        element: 'enrollments-page',
        title: 'Enrollments',
        load: async () => {
            try {
                await dataManager.populateEnrollmentSelects();
            } catch (error) {
                handleError(error);
            }
        }
    },
    settings: {
        path: '#/settings',
        element: 'settings-page',
        title: 'Settings'
    }
};

// Internal variable to store the currently active course ID for modules
let currentModuleCourseId = null;

/**
 * Initialize navigation (sidebar toggle, hashchange listener)
 */
export const initializeNavigation = () => {
    // Update: Use data-nav instead of data-page
    document.querySelectorAll('[data-nav]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const routeName = item.dataset.nav;
            navigateTo(routeName);
        });
    });
    
    // Add event listener for the mobile sidebar toggle button
    const toggleBtn = document.getElementById('toggleBtn');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Add event listener for the "Back to Courses" button on the modules page
    const backToCoursesBtn = document.getElementById('back-to-courses-btn');
    if (backToCoursesBtn) {
        backToCoursesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('courses'); // Navigate back to the courses page
        });
    }

    // Handle browser back/forward
    window.addEventListener('hashchange', handleRouteChange);
    
    // Handle initial route on page load
    handleRouteChange();
    
    console.log('Navigation initialized');
};

/**
 * Navigate to a specific route
 * @param {string} routeName - Name of the route (e.g., 'dashboard', 'courses')
 * @param {Object} params - Route parameters (e.g., { courseId: 'someId' })
 */
export const navigateTo = (routeName, params = {}) => {
    console.log('Navigating to:', routeName, 'with params:', params);
    
    const routeConfig = routes[routeName];
    if (!routeConfig) {
        console.error('Route not found:', routeName);
        return;
    }
    
    let path = routeConfig.path;
    
    // Replace route parameters
    Object.keys(params).forEach(key => {
        path = path.replace(`:${key}`, params[key]);
    });
    
    // Set the currentModuleCourseId if navigating to modules with a specific ID
    if (routeName === 'modules' && params.courseId) {
        currentModuleCourseId = params.courseId;
    } else if (routeName !== 'modules') {
        currentModuleCourseId = null; // Reset if navigating away from modules
    }

    // Update URL
    window.location.hash = path;
};

/**
 * Get the current course ID for module operations.
 * This is crucial for adding new modules to the correct course.
 * @returns {string|null} The current course ID or null if not on a module-specific page.
 */
export const getCurrentModuleCourseId = () => {
    return currentModuleCourseId;
};

/**
 * Handle route change (triggered by hashchange or initial load)
 */
const handleRouteChange = async () => {
    const hash = window.location.hash || '#/dashboard';
    console.log('Hash changed to:', hash);
    
    // Hide all pages by removing active-page class
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active-page');
    });
    
    // Find matching route
    let matchedRoute = null;
    let params = {};
    
    for (const [name, route] of Object.entries(routes)) {
        const pattern = route.path.replace(/:(\w+)/g, '(?<$1>[^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        const match = hash.match(regex);
        
        if (match) {
            matchedRoute = { name, ...route };
            if (match.groups) {
                params = match.groups;
            }
            break;
        }
    }
    
    if (!matchedRoute) {
        console.warn('No matching route found for:', hash, 'Defaulting to dashboard.');
        navigateTo('dashboard');
        return;
    }
    
    // Show active page by adding active-page class
    const pageElement = document.getElementById(matchedRoute.element);
    if (pageElement) {
        pageElement.classList.add('active-page');
        
        // Update page title
        document.title = `TechLaunch Admin Dashboard - ${matchedRoute.title}`;
        
        // Update active navigation item in the sidebar
        document.querySelectorAll('.nav-link').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.nav === matchedRoute.name) {
                item.classList.add('active');
            }
        });
        
        // Load route-specific data
        if (matchedRoute.load) {
            console.log('Loading data for route:', matchedRoute.name, 'with params:', params);
            await matchedRoute.load(params);
        }
    } else {
        console.error('Page element not found:', matchedRoute.element);
    }
};

/**
 * Load data for specific page
 * @param {string} pageId - ID of the page to load data for
 */
export const loadPageData = async (pageId) => {
    console.log('Loading data for page:', pageId);
    try {
        switch (pageId) {
            case 'dashboard':
                await Promise.all([
                    fetchDashboardStats(),
                    fetchRecentActivity()
                ]);
                break;
                
            case 'users':
                await fetchUsers();
                break;
                
            case 'courses':
                await fetchCourses();
                break;
                
            case 'enrollments':
                await Promise.all([
                    fetchUsers(),
                    fetchCourses()
                ]);
                break;
                
            default:
                console.log('No data to load for page:', pageId);
        }
        console.log('Data loaded for page:', pageId);
    } catch (error) {
        console.error('Error loading data for page:', pageId, error);
    }
};

/**
 * Handle navigation click
 * @param {Event} e - Click event
 * @param {string} pageId - ID of the page to navigate to
 */
const handleNavigation = async (e, pageId) => {
    e.preventDefault();
    console.log('Navigation clicked:', pageId);
    
    // Show the page first for better UX
    showPage(pageId);
    
    // Then load the data
    await loadPageData(pageId);
};

/**
 * Setup navigation event listeners
 */
export const setupNavigationListeners = () => {
    console.log('Setting up navigation listeners');
    
    // Navigation items
    document.querySelectorAll('.nav-link').forEach(item => {
        const pageId = item.getAttribute('data-page');
        if (pageId) {
            item.addEventListener('click', (e) => handleNavigation(e, pageId));
        }
    });
    
    // Toggle sidebar button
    const sidebarToggle = document.getElementById('toggleBtn');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Create user button
    const createUserBtn = document.getElementById('create-user-btn');
    if (createUserBtn) {
        createUserBtn.addEventListener('click', showCreateUserModal);
    }
    
    // Create course button
    const createCourseBtn = document.getElementById('create-course-btn');
    if (createCourseBtn) {
        createCourseBtn.addEventListener('click', showCreateCourseModal);
    }
    
    // User search input
    const userSearchInput = document.getElementById('user-search');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', filterUsers);
    }
    
    // Enroll button
    const enrollBtn = document.getElementById('enroll-btn');
    if (enrollBtn) {
        enrollBtn.addEventListener('click', enrollUser);
    }
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.closest('.modal').id;
            closeModal(modalId);
        });
    });
    
    // Back to courses button
    const backToCoursesBtn = document.getElementById('back-to-courses-btn');
    if (backToCoursesBtn) {
        backToCoursesBtn.addEventListener('click', (e) => handleNavigation(e, 'courses'));
    }
    
    // Load initial page data
    const activePage = document.querySelector('.page.active-page');
    if (activePage) {
        loadPageData(activePage.id);
    } else {
        // Default to dashboard if no active page
        showPage('dashboard');
        loadPageData('dashboard');
    }
    
    console.log('Navigation listeners set up');
};