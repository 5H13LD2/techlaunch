//================
//userManagement.js
//================

// courseManagement.js
// Course Management Module following the same pattern as moduleManagement.js

const API_BASE_URL = 'http://localhost:3001/api';

// Utility functions
const showLoading = () => {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'flex';
};

const hideLoading = () => {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'none';
};

const showToast = (message, type = 'success') => {
    // Simple alert for now - can be enhanced with proper toast notifications
    if (type === 'error') {
        alert(`Error: ${message}`);
    } else {
        alert(message);
    }
};

// Course Management Class
export class CourseManager {
    static courses = [];

    // Initialize the course manager
    static async init() {
        await this.loadCourses();
    }

    // Load all courses from API
    static async loadCourses() {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/courses`);
            const data = await response.json();
            
            const coursesGrid = document.getElementById('courses-grid');
            if (!coursesGrid) return;

            coursesGrid.innerHTML = '';

            if (data.success && data.data && data.data.length > 0) {
                this.courses = data.data;
                this.displayCourses(data.data);
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showErrorState();
        } finally {
            hideLoading();
        }
    }

    // Display courses in grid
    static displayCourses(courses) {
        const coursesGrid = document.getElementById('courses-grid');
        if (!coursesGrid) return;

        coursesGrid.innerHTML = courses.map(course => `
            <div class="course-card">
                <h3>${course.name || 'Untitled Course'}</h3>
                <p>${course.description || 'No description available'}</p>
                <div class="course-users">
                    <i class="fas fa-users"></i>
                    <span>${course.enrolledUsers || 0} enrolled users</span>
                </div>
                <div class="course-info">
                    <strong>Course ID:</strong> ${course.id}
                    ${course.createdAt ? `<br><strong>Created:</strong> ${new Date(course.createdAt).toLocaleDateString()}` : ''}
                </div>
                <div class="course-actions">
                    <button class="btn btn-outline-primary" onclick="editCourse('${course.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteCourse('${course.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Show empty state when no courses
    static showEmptyState() {
        const coursesGrid = document.getElementById('courses-grid');
        if (!coursesGrid) return;

        coursesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>No Courses Yet</h3>
                <p>Get started by creating your first course using the "Add Course" button above.</p>
            </div>
        `;
    }

    // Show error state when loading fails
    static showErrorState() {
        const coursesGrid = document.getElementById('courses-grid');
        if (!coursesGrid) return;

        coursesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to Load Courses</h3>
                <p>Unable to connect to the server. Please check your connection and try again.</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }

    // Create new course
    static async createCourse(courseData) {
        if (!courseData.id || !courseData.name || !courseData.description) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            const data = await response.json();
            
            if (data.success) {
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('addCourseModal'));
                if (modal) modal.hide();
                
                const form = document.getElementById('create-course-form');
                if (form) form.reset();
                
                // Reload courses
                await this.loadCourses();
                showToast('Course created successfully!');
            } else {
                showToast(data.message || 'Error creating course', 'error');
            }
        } catch (error) {
            console.error('Error creating course:', error);
            showToast('Failed to create course. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    }

    // Update existing course
    static async updateCourse(courseId, updateData) {
        if (!updateData.name || !updateData.description) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            
            if (data.success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editCourseModal'));
                if (modal) modal.hide();
                
                // Reload courses
                await this.loadCourses();
                showToast('Course updated successfully!');
            } else {
                showToast(data.message || 'Error updating course', 'error');
            }
        } catch (error) {
            console.error('Error updating course:', error);
            showToast('Failed to update course. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    }

    // Delete course
    static async deleteCourse(courseId) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                await this.loadCourses();
                showToast('Course deleted successfully!');
            } else {
                showToast(data.message || 'Error deleting course', 'error');
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast('Failed to delete course. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    }

    // Edit course - populate the edit modal
    static async editCourse(courseId) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                // Populate edit form
                document.getElementById('edit-course-id').value = data.data.id;
                document.getElementById('edit-course-name').value = data.data.name || '';
                document.getElementById('edit-course-description').value = data.data.description || '';
                
                // Show edit modal
                const modal = new bootstrap.Modal(document.getElementById('editCourseModal'));
                modal.show();
            } else {
                showToast('Failed to load course details', 'error');
            }
        } catch (error) {
            console.error('Error loading course details:', error);
            showToast('Failed to load course details', 'error');
        } finally {
            hideLoading();
        }
    }

    // Get course by ID
    static getCourseById(courseId) {
        return this.courses.find(course => course.id === courseId);
    }

    // Get all courses
    static getAllCourses() {
        return this.courses;
    }

    // Search courses
    static searchCourses(searchTerm) {
        if (!searchTerm) return this.courses;
        
        const term = searchTerm.toLowerCase();
        return this.courses.filter(course => 
            course.name?.toLowerCase().includes(term) ||
            course.description?.toLowerCase().includes(term) ||
            course.id?.toLowerCase().includes(term)
        );
    }

    // Filter and display courses based on search
    static filterCourses(searchTerm) {
        const filteredCourses = this.searchCourses(searchTerm);
        this.displayCourses(filteredCourses);
    }
}

// Export for use in other modules
export default CourseManager;