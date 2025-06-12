// ================
// src/utils/moduleManagement.js
// ================
// Handles module-related functionality and UI updates

import { dataManager } from './dataManager.js';
import { showToast, handleError } from './dom.js';

/**
 * Initialize module management functionality
 */
export const initializeModuleManagement = () => {
    console.log('Module management initialized');
    
    // Add any module-specific event listeners or initialization here
    document.addEventListener('moduleview', async (event) => {
        const { courseId } = event.detail;
        if (courseId) {
            try {
                await loadModuleList(courseId);
            } catch (error) {
                handleError(error);
                showToast('Failed to load modules', 'error');
            }
        }
    });
};

/**
 * Load and display modules for a specific course
 */
const loadModuleList = async (courseId) => {
    try {
        const modules = await dataManager.loadModules(courseId);
        updateModuleList(modules);
    } catch (error) {
        handleError(error);
        showToast('Failed to load modules', 'error');
    }
};

/**
 * Update the module list in the UI
 */
const updateModuleList = (modules) => {
    const moduleList = document.getElementById('module-list');
    if (!moduleList) return;

    moduleList.innerHTML = '';
    
    modules.forEach(module => {
        const moduleElement = createModuleElement(module);
        moduleList.appendChild(moduleElement);
    });
};

/**
 * Create a module element for the UI
 */
const createModuleElement = (module) => {
    const div = document.createElement('div');
    div.className = 'module-item';
    div.innerHTML = `
        <h3>${module.title}</h3>
        <p>${module.description}</p>
        <div class="module-actions">
            <button class="btn btn-primary btn-sm edit-module" data-id="${module.id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-module" data-id="${module.id}">Delete</button>
        </div>
    `;
    return div;
};

// Export any functions that need to be accessed from other modules
export {
    loadModuleList
}; 