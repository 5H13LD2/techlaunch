// ================
// src/utils/dom-handlers.js
// ================
// Handles all direct DOM interactions, event listeners for forms, modals, etc.

import { showModal, closeModal, showToast, handleError } from './dom.js';
import { dataManager } from './dataManager.js';
import { getCurrentModuleCourseId } from './navigation.js';

/**
 * Initializes all global DOM event listeners for buttons, forms, and modals.
 */
export const initializeDomHandlers = () => {
    // Set up global modal functions (if inline onclicks are still used, though not recommended)
    window.showCreateUserModal = () => showModal('create-user-modal');
    window.showCreateCourseModal = () => showModal('create-course-modal');
    window.showCreateModuleModal = () => showModal('create-module-modal');
    window.closeModal = (id) => closeModal(id);

    // Attach event listeners for buttons that open modals
    document.getElementById('add-user-btn')?.addEventListener('click', () => showModal('create-user-modal'));
    document.getElementById('add-course-btn')?.addEventListener('click', () => showModal('create-course-modal'));
    document.getElementById('add-module-btn')?.addEventListener('click', () => showModal('create-module-modal'));
    
    // Attach event listeners for closing modals via the 'x' button or cancel buttons
    document.querySelectorAll('.modal .close').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.target.dataset.modal;
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
    document.querySelectorAll('.modal .btn-secondary[data-modal]').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.target.dataset.modal;
            if (modalId) {
                closeModal(modalId);
            }
        });
    });

    // Handle form submissions
    document.getElementById('create-user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('new-username').value;
        const email = document.getElementById('new-email').value;
        try {
            await dataManager.createUser({ username, email });
            showToast('User created successfully!', 'success');
            closeModal('create-user-modal');
            dataManager.loadUsers(); // Refresh user list
        } catch (err) {
            handleError(err);
            showToast('Failed to create user', 'error');
        }
    });

    document.getElementById('create-course-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('new-course-id').value;
        const name = document.getElementById('new-course-name').value;
        const description = document.getElementById('new-course-description').value;
        try {
            await dataManager.createCourse({ id, name, description });
            showToast('Course created successfully!', 'success');
            closeModal('create-course-modal');
            dataManager.loadCourses(); // Refresh course list
        } catch (err) {
            handleError(err);
            showToast('Failed to create course', 'error');
        }
    });

    document.getElementById('create-module-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-module-title').value;
        const description = document.getElementById('new-module-description').value;
        const order = parseInt(document.getElementById('new-module-order').value, 10);
        
        const currentCourseId = getCurrentModuleCourseId(); // Get the currently active course ID
        if (!currentCourseId) {
            showToast('No course selected for module creation. Please navigate to a specific course\'s modules.', 'error');
            return;
        }
        try {
            await dataManager.createModule(currentCourseId, { title, description, order });
            showToast('Module created successfully!', 'success');
            closeModal('create-module-modal');
            dataManager.loadModules(currentCourseId); // Refresh module list for the current course
        } catch (err) {
            handleError(err);
            showToast('Failed to create module', 'error');
        }
    });

    // Handle enrollment functionality
    document.getElementById('enroll-user-btn')?.addEventListener('click', async () => {
        const userId = document.getElementById('user-select').value;
        const courseId = document.getElementById('course-select').value;

        if (!userId || !courseId) {
            showToast('Please select both a user and a course.', 'warning');
            return;
        }

        try {
            await dataManager.enrollUser(userId, courseId);
            showToast('User enrolled successfully!', 'success');
            dataManager.loadUsers(); // Refresh users list to show new enrollment
        } catch (error) {
            handleError(error);
            showToast('Failed to enroll user', 'error');
        }
    });

    // Handle user search functionality
    document.getElementById('user-search')?.addEventListener('keyup', (event) => {
        const searchTerm = event.target.value;
        dataManager.filterUsers(searchTerm); // Assuming dataManager has this method
    });

    console.log('DOM handlers initialized.');
};

// You can optionally export `goBackToCourses`, `filterUsers`, `enrollUser` if they are directly
// called from `window` (inline onclicks) in your HTML.
// However, it's recommended to update HTML to use event listeners as shown above.
// For now, mirroring the old global functions for compatibility:
window.filterUsers = (event) => {
    document.getElementById('user-search')?.dispatchEvent(new KeyboardEvent('keyup', {'key': 'Enter'})); // Simulate keyup
};
// `goBackToCourses` was moved into navigation.js's `initializeNavigation`
// `enrollUser` was moved into initializeDomHandlers 