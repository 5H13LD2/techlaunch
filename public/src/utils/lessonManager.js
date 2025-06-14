// src/utils/lessonManagement.js

const API_BASE_URL = 'http://localhost:3001/api'; // Adjust to your API endpoint

export class LessonManager {
    static lessons = [];
    static courses = [];
    static modules = [];
    static currentCourseFilter = '';
    static currentModuleFilter = '';
    static codeEditors = new Map(); // Store CodeMirror instances

    static async init() {
        showLoading();
        try {
            await Promise.all([
                this.loadCourses(),
                this.loadModules(),
                this.loadLessons()
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
        try {
            const url = courseId ? 
                `${API_BASE_URL}/modules?courseId=${courseId}` : 
                `${API_BASE_URL}/modules`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.modules = data.data;
                this.populateModuleSelectors(courseId);
            } else {
                throw new Error(data.message || 'Failed to load modules');
            }
        } catch (error) {
            console.error('Error loading modules:', error);
            this.modules = [];
            showToast('Failed to load modules', 'error');
        }
    }

    static async loadLessons(courseId = '', moduleId = '') {
        showLoading();
        try {
            let url = `${API_BASE_URL}/lessons`;
            const params = new URLSearchParams();
            
            if (courseId) params.append('courseId', courseId);
            if (moduleId) params.append('moduleId', moduleId);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.lessons = data.data;
                this.renderLessons();
            } else {
                throw new Error(data.message || 'Failed to load lessons');
            }
        } catch (error) {
            console.error('Error loading lessons:', error);
            this.lessons = [];
            showToast('Failed to load lessons', 'error');
        } finally {
            hideLoading();
        }
    }

    static populateCourseSelectors() {
        const selectors = ['lesson-course-filter', 'lesson-course'];
        
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
                option.textContent = course.name;
                selector.appendChild(option);
            });
        });
    }

    static populateModuleSelectors(courseId) {
        const selectors = ['lesson-module-filter', 'lesson-module'];
        const filteredModules = courseId ? 
            this.modules.filter(m => m.courseId === courseId) : 
            this.modules;
        
        selectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            if (!selector) return;

            // Clear existing options (except first one)
            while (selector.children.length > 1) {
                selector.removeChild(selector.lastChild);
            }

            // Add module options
            filteredModules.forEach(module => {
                const option = document.createElement('option');
                option.value = module.id;
                option.textContent = module.title;
                selector.appendChild(option);
            });
        });
    }

    static renderLessons() {
        const container = document.getElementById('lessons-container');
        if (!container) return;

        if (this.lessons.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-book-open fa-3x mb-3"></i>
                        <h3>No Lessons Found</h3>
                        <p>Start by creating your first lesson</p>
                        <button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#addLessonModal">
                            <i class="fas fa-plus me-2"></i>Create Lesson
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.lessons.map(lesson => this.createLessonCard(lesson)).join('');
    }

    static createLessonCard(lesson) {
        const course = this.courses.find(c => c.id === lesson.courseId);
        const module = this.modules.find(m => m.id === lesson.moduleId);
        
        return `
            <div class="lesson-card">
                <div class="lesson-header">
                    <div>
                        <h3 class="lesson-title">${lesson.title}</h3>
                        <span class="lesson-id">${lesson.id}</span>
                    </div>
                    <div class="lesson-badges">
                        ${lesson.hasCodeExercise ? '<span class="lesson-badge badge-code"><i class="fas fa-code"></i>Code Exercise</span>' : ''}
                        ${lesson.videoUrl ? '<span class="lesson-badge badge-video"><i class="fas fa-video"></i>Video</span>' : ''}
                    </div>
                </div>
                <div class="lesson-meta">
                    <div class="meta-item">
                        <i class="fas fa-book"></i>
                        <span>${course?.name || lesson.courseId}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-cubes"></i>
                        <span>${module?.title || lesson.moduleId}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${lesson.estimatedMinutes} minutes</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-sort-numeric-up"></i>
                        <span>Order: ${lesson.order}</span>
                    </div>
                </div>
                <div class="lesson-content">${lesson.content}</div>
                ${lesson.codeSample ? `
                    <div class="code-sample">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="mb-0">Code Sample</h5>
                            <button class="btn btn-sm btn-outline-secondary" onclick="copyLessonCode('${lesson.id}')">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <pre><code>${lesson.codeSample}</code></pre>
                    </div>
                ` : ''}
                <div class="lesson-actions">
                    <button class="btn-action" onclick="viewLesson('${lesson.id}')" title="View Lesson">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="editLesson('${lesson.id}')" title="Edit Lesson">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-danger" onclick="deleteLesson('${lesson.id}')" title="Delete Lesson">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    static async createLesson(lessonData) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/lessons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lessonData)
            });

            const data = await response.json();
            
            if (data.success) {
                showToast('Lesson created successfully!');
                await this.loadLessons(lessonData.courseId, lessonData.moduleId);
                return data.data;
            } else {
                throw new Error(data.message || 'Failed to create lesson');
            }
        } catch (error) {
            console.error('Error creating lesson:', error);
            showToast(error.message || 'Failed to create lesson', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    static async updateLesson(lessonId, updateData) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            
            if (data.success) {
                showToast('Lesson updated successfully!');
                await this.loadLessons(updateData.courseId, updateData.moduleId);
                return data.data;
            } else {
                throw new Error(data.message || 'Failed to update lesson');
            }
        } catch (error) {
            console.error('Error updating lesson:', error);
            showToast(error.message || 'Failed to update lesson', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    static async deleteLesson(lessonId) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                showToast('Lesson deleted successfully!');
                await this.loadLessons(this.currentCourseFilter, this.currentModuleFilter);
                return true;
            } else {
                throw new Error(data.message || 'Failed to delete lesson');
            }
        } catch (error) {
            console.error('Error deleting lesson:', error);
            showToast(error.message || 'Failed to delete lesson', 'error');
            throw error;
        } finally {
            hideLoading();
        }
    }

    static async editLesson(lessonId) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`);
            const data = await response.json();
            
            if (data.success) {
                const lesson = data.data;
                document.getElementById('edit-lesson-id').value = lesson.id;
                document.getElementById('edit-lesson-title').value = lesson.title;
                document.getElementById('edit-lesson-description').value = lesson.description;
                document.getElementById('edit-lesson-order').value = lesson.order;
                document.getElementById('edit-lesson-duration').value = lesson.duration;
                document.getElementById('edit-lesson-status').value = lesson.status;
                
                const modal = new bootstrap.Modal(document.getElementById('editLessonModal'));
                modal.show();
            } else {
                throw new Error(data.message || 'Failed to load lesson details');
            }
        } catch (error) {
            console.error('Error loading lesson details:', error);
            showToast(error.message || 'Failed to load lesson details', 'error');
        } finally {
            hideLoading();
        }
    }

    static filterLessons(courseId, moduleId) {
        this.currentCourseFilter = courseId;
        this.currentModuleFilter = moduleId;
        this.loadLessons(courseId, moduleId);
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

export default LessonManager; 