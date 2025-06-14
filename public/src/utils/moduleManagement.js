// src/utils/moduleManagement.js

const API_BASE_URL = 'http://localhost:3001/api'; // Adjust to your API endpoint

export class ModuleManager {
    static modules = [];
    static courses = [];

    static async init() {
        showLoading();
        try {
            await Promise.all([
                this.loadCourses(),
                this.loadModules()
            ]);
        } catch (error) {
            console.error('Failed to initialize:', error);
            showToast('Failed to load data', 'error');
        } finally {
            hideLoading();
        }
    }

    static async loadCourses() {
        try {
            const response = await fetch(`${API_BASE_URL}/courses`);
            const data = await response.json();
            
            if (data.success) {
                this.courses = data.data;
                console.log('Loaded courses:', this.courses); // Debug log
                this.populateCourseSelectors();
            } else {
                throw new Error(data.message || 'Failed to load courses');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.courses = [];
            showToast('Failed to load courses', 'error');
        }
    }

    static async loadModules(courseId = '') {
        showLoading();
        try {
            const url = courseId ? 
                `${API_BASE_URL}/modules?courseId=${courseId}` : 
                `${API_BASE_URL}/modules`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.modules = data.data;
                this.renderModules();
            } else {
                throw new Error(data.message || 'Failed to load modules');
            }
        } catch (error) {
            console.error('Error loading modules:', error);
            this.modules = [];
            showToast('Failed to load modules', 'error');
        } finally {
            hideLoading();
        }
    }

    static populateCourseSelectors() {
        const selectors = ['course-filter', 'module-course'];
        
        selectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            if (!selector) return;

            // Clear existing options (except first one)
            while (selector.children.length > 1) {
                selector.removeChild(selector.lastChild);
            }

            // Add course options
            this.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                // Use courseId or name depending on what's available
                option.textContent = course.courseId || course.name || course.id;
                console.log('Adding course option:', course); // Debug log
                selector.appendChild(option);
            });
        });
    }

    static renderModules() {
        const grid = document.getElementById('modules-grid');
        if (!grid) return;

        if (this.modules.length === 0) {
            grid.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-cubes fa-3x mb-3"></i>
                        <h3>No Modules Found</h3>
                        <p>Start by creating your first module</p>
                        <button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#addModuleModal">
                            <i class="fas fa-plus me-2"></i>Create Module
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.modules.map(module => this.createModuleCard(module)).join('');
    }

    static createModuleCard(module) {
        if (!module) return '';
        
        const course = this.courses.find(c => c.id === module.courseId);
        const courseName = course ? course.name : module.courseId || 'Unknown Course';
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="module-card">
                    <div class="module-header">
                        <h3 class="module-title">${this.escapeHtml(module.title || 'Untitled Module')}</h3>
                        <span class="module-id">${this.escapeHtml(module.id || 'No ID')}</span>
                    </div>
                    <div class="module-body">
                        <p class="module-description">${this.escapeHtml(module.description || 'No description available')}</p>
                        <div class="module-meta">
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <div class="meta-label">Duration</div>
                                <div class="meta-value">${module.estimatedMinutes || 0} min</div>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-list"></i>
                                <div class="meta-label">Lessons</div>
                                <div class="meta-value">${module.totalLessons || 0}</div>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-sort-numeric-up"></i>
                                <div class="meta-label">Order</div>
                                <div class="meta-value">${module.order || 0}</div>
                            </div>
                        </div>
                    </div>
                    <div class="module-footer">
                        <div class="course-info">
                            <i class="fas fa-book me-1"></i>
                            <span>${this.escapeHtml(courseName)}</span>
                        </div>
                        <div class="module-actions">
                            <a href="lesson.html?courseId=${module.courseId || ''}&moduleId=${module.id || ''}" 
                               class="btn btn-sm btn-outline-primary me-2" 
                               title="View Lessons">
                                <i class="fas fa-graduation-cap"></i>
                            </a>
                            <button class="btn btn-sm btn-outline-secondary me-2" 
                                onclick="handleModuleAction('edit', '${module.id || ''}')" 
                                title="Edit Module">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" 
                                onclick="handleModuleAction('delete', '${module.id || ''}')" 
                                title="Delete Module">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static async createModule(moduleData) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/modules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(moduleData)
            });

            const data = await response.json();
            
            if (data.success) {
                showToast('Module created successfully!');
                await this.loadModules(moduleData.courseId);
                return data.data;
            } else {
                throw new Error(data.message || 'Failed to create module');
            }
        } catch (error) {
            console.error('Error creating module:', error);
            showToast(error.message || 'Failed to create module', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    static async updateModule(moduleId, updateData) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            
            if (data.success) {
                showToast('Module updated successfully!');
                await this.loadModules(updateData.courseId);
                return data.data;
            } else {
                throw new Error(data.message || 'Failed to update module');
            }
        } catch (error) {
            console.error('Error updating module:', error);
            showToast(error.message || 'Failed to update module', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    static async deleteModule(moduleId) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                showToast('Module deleted successfully!');
                await this.loadModules();
                return true;
            } else {
                throw new Error(data.message || 'Failed to delete module');
            }
        } catch (error) {
            console.error('Error deleting module:', error);
            showToast(error.message || 'Failed to delete module', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    static async editModule(moduleId) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`);
            const data = await response.json();
            
            if (data.success) {
                const module = data.data;
                document.getElementById('edit-module-id').value = module.id;
                document.getElementById('edit-module-title').value = module.title;
                document.getElementById('edit-module-description').value = module.description;
                document.getElementById('edit-module-order').value = module.order;
                document.getElementById('edit-module-minutes').value = module.estimatedMinutes;
                document.getElementById('edit-module-lessons').value = module.totalLessons;
                
                const modal = new bootstrap.Modal(document.getElementById('editModuleModal'));
                modal.show();
            } else {
                throw new Error(data.message || 'Failed to load module details');
            }
        } catch (error) {
            console.error('Error loading module details:', error);
            showToast(error.message || 'Failed to load module details', 'error');
        } finally {
            hideLoading();
        }
    }

    static filterModules(courseId) {
        if (!courseId) {
            this.renderModules();
            return;
        }

        const filteredModules = this.modules.filter(module => module.courseId === courseId);
        const grid = document.getElementById('modules-grid');
        
        if (!grid) return;

        if (filteredModules.length === 0) {
            grid.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-filter fa-3x mb-3"></i>
                        <h3>No Modules Found</h3>
                        <p>No modules found for the selected course</p>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredModules.map(module => this.createModuleCard(module)).join('');
    }

    static escapeHtml(unsafe) {
        if (unsafe == null) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Utility functions
function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'flex';
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'none';
}

function showToast(message, type = 'success') {
    // Simple alert for now - can be enhanced with proper toast notifications
    if (type === 'error') {
        alert(`Error: ${message}`);
    } else {
        alert(message);
    }
}

export default ModuleManager;