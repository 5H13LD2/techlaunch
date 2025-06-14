// ================
// dom.js
// ================
// DOM manipulation utilities and UI helpers
// Handles loading states, toasts, and common DOM operations

/**
 * DOM Elements Cache
 * Cache frequently used DOM elements for better performance
 */
export const elements = {
    // Dashboard elements
    totalUsers: document.getElementById('total-users'),
    totalCourses: document.getElementById('total-courses'),
    totalEnrollments: document.getElementById('total-enrollments'),
    recentActivityList: document.getElementById('recent-activity-list'),
    
    // User management elements
    usersTableBody: document.getElementById('users-table-body'),
    userSearch: document.getElementById('user-search'),
    userSelect: document.getElementById('user-select'),
    
    // Course management elements
    coursesGrid: document.getElementById('courses-grid'),
    courseSelect: document.getElementById('course-select'),
    
    // Module management elements
    modulesGrid: document.getElementById('modules-grid'),
    modulesList: document.getElementById('modules-list'),
    
    // UI elements
    loadingSpinner: document.getElementById('loading-spinner'),
    toastContainer: document.getElementById('toast-container'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    
    // Modal elements
    createUserModal: document.getElementById('create-user-modal'),
    createCourseModal: document.getElementById('create-course-modal'),
    createModuleModal: document.getElementById('create-module-modal'),
    editCourseModal: document.getElementById('edit-course-modal'),
    editModuleModal: document.getElementById('edit-module-modal'),
    
    pages: {
        dashboard: document.getElementById('dashboard'),
        users: document.getElementById('users'),
        courses: document.getElementById('courses'),
        modules: document.getElementById('modules'),
        enrollments: document.getElementById('enrollments')
    }
};

/**
 * Loading State Management
 */
export const showLoading = () => {
    if (elements.loadingSpinner) {
        elements.loadingSpinner.style.display = 'flex';
    }
};

export const hideLoading = () => {
    if (elements.loadingSpinner) {
        elements.loadingSpinner.style.display = 'none';
    }
};

/**
 * Toast Notification System
 * @param {string} message - Toast message
 * @param {string} type - Toast type ('success', 'error', 'warning', 'info')
 * @param {number} duration - Display duration in milliseconds
 */
export const showToast = (message, type = 'success', duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Create toast container if it doesn't exist
    if (!elements.toastContainer) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        elements.toastContainer = container;
    }
    
    // Apply toast styles
    toast.style.cssText = `
        padding: 12px 24px;
        margin-bottom: 10px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        word-wrap: break-word;
        ${getToastColor(type)}
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Trigger entrance animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove toast
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (elements.toastContainer && elements.toastContainer.contains(toast)) {
                elements.toastContainer.removeChild(toast);
            }
        }, 300);
    }, duration);
};

/**
 * Get toast background color based on type
 * @param {string} type - Toast type
 * @returns {string} CSS background color
 */
const getToastColor = (type) => {
    const colors = {
        success: 'background: linear-gradient(135deg, #10b981, #059669);',
        error: 'background: linear-gradient(135deg, #ef4444, #dc2626);',
        warning: 'background: linear-gradient(135deg, #f59e0b, #d97706);',
        info: 'background: linear-gradient(135deg, #3b82f6, #2563eb);'
    };
    return colors[type] || colors.success;
};

/**
 * Modal Management
 */
export const showModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
};

export const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Re-enable scrolling
    }
};

/**
 * Form Utilities
 */
export const getFormData = (formId) => {
    const form = document.getElementById(formId);
    if (!form) return null;
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
};

export const setFormData = (formId, data) => {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"], #${key}`);
        if (input) {
            input.value = data[key] || '';
        }
    });
    
    return true;
};

export const clearForm = (formId) => {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
};

/**
 * Element Visibility Utilities
 */
export const showElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'block';
    }
};

export const hideElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
};

/**
 * Dashboard UI Updates
 */
export const updateDashboardStats = (stats) => {
    if (elements.totalUsers) {
        elements.totalUsers.textContent = stats.totalUsers;
    }
    if (elements.totalCourses) {
        elements.totalCourses.textContent = stats.totalCourses;
    }
    if (elements.totalEnrollments) {
        elements.totalEnrollments.textContent = stats.totalEnrollments;
    }
    updateRecentActivity(stats.recentActivity);
};

export const updateRecentActivity = (activities) => {
    if (!elements.recentActivityList) return;
    
    elements.recentActivityList.innerHTML = '';
    activities.forEach(activity => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        
        const time = new Date(activity.timestamp).toLocaleString();
        li.innerHTML = `
            <div class="activity-icon ${activity.type}"></div>
            <div class="activity-content">
                <p class="activity-message">${activity.message}</p>
                <span class="activity-time">${time}</span>
            </div>
        `;
        
        elements.recentActivityList.appendChild(li);
    });
};

/**
 * User Management UI Updates
 */
export const updateUsersList = (users) => {
    if (!elements.usersTableBody) return;
    
    elements.usersTableBody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${(user.coursesTaken || user.courseTaken || []).length}</td>
            <td>
                <button class="btn-edit" data-user-id="${user.id}">Edit</button>
                <button class="btn-delete" data-user-id="${user.id}">Delete</button>
            </td>
        `;
        elements.usersTableBody.appendChild(tr);
    });
};

/**
 * Course Management UI Updates
 */
export const updateCoursesGrid = (courses) => {
    if (!elements.coursesGrid) return;
    
    elements.coursesGrid.innerHTML = '';
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <h3>${course.courseName}</h3>
            <p>${course.description}</p>
            <div class="course-stats">
                <span>${course.enrolledUsers?.length || 0} students</span>
                <span>${course.moduleCount || 0} modules</span>
            </div>
            <div class="course-actions">
                <button class="btn-edit" data-course-id="${course.id}">Edit</button>
                <button class="btn-delete" data-course-id="${course.id}">Delete</button>
                <button class="btn-modules" data-course-id="${course.id}">Modules</button>
            </div>
        `;
        elements.coursesGrid.appendChild(card);
    });
};

/**
 * Module Management UI Updates
 */
export const updateModulesList = (modules) => {
    if (!elements.modulesList) return;
    
    elements.modulesList.innerHTML = '';
    modules.forEach(module => {
        const item = document.createElement('div');
        item.className = 'module-item';
        item.innerHTML = `
            <div class="module-header">
                <h4>${module.title}</h4>
                <span class="module-duration">${module.duration} min</span>
            </div>
            <p>${module.description}</p>
            <div class="module-actions">
                <button class="btn-edit" data-module-id="${module.id}">Edit</button>
                <button class="btn-delete" data-module-id="${module.id}">Delete</button>
            </div>
        `;
        elements.modulesList.appendChild(item);
    });
};

/**
 * Select Element Updates
 */
export const updateUserSelect = (users) => {
    if (!elements.userSelect) return;
    
    elements.userSelect.innerHTML = '<option value="">Select User</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.username} (${user.email})`;
        elements.userSelect.appendChild(option);
    });
};

export const updateCourseSelect = (courses) => {
    if (!elements.courseSelect) return;
    
    elements.courseSelect.innerHTML = '<option value="">Select Course</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.courseName;
        elements.courseSelect.appendChild(option);
    });
};

/**
 * Sidebar Management
 */
export const toggleSidebar = (show = true) => {
    if (elements.sidebar) {
        elements.sidebar.classList.toggle('active', show);
    }
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.style.display = show ? 'block' : 'none';
    }
};

/**
 * Error Handling
 */
export const handleError = (error) => {
    console.error('Error:', error);
    showToast(error.message || 'An error occurred', 'error');
};

/**
 * Show/hide modal
 * @param {string} modalId - ID of the modal to show/hide
 */
export const toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = show ? 'block' : 'none';
    }
};

/**
 * Show page by ID and update navigation
 * @param {string} pageId - ID of the page to show
 */
export const showPage = (pageId) => {
    console.log('Showing page:', pageId);
    
    // Hide all pages
    Object.values(elements.pages).forEach(page => {
        if (page) {
            page.style.display = 'none';
            page.classList.remove('active-page');
        }
    });
    
    // Show selected page
    const selectedPage = elements.pages[pageId];
    if (selectedPage) {
        selectedPage.style.display = 'block';
        selectedPage.classList.add('active-page');
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
        
        console.log('Page shown:', pageId);
    } else {
        console.error('Page not found:', pageId);
    }
};