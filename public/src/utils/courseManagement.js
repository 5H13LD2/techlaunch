//================
//userManagement.js
//================

// courseManagement.js
// Course Management Module using backend API

import { showLoading, hideLoading, showToast } from './display.js';
import { apiCall } from './api.js';
import { closeModal } from './dom.js';

const API_BASE_URL = 'http://localhost:3001/api';

let courses = [];

// Load all courses from backend API
export const loadCourses = async () => {
    try {
        showLoading('📚 Loading courses...');
        const response = await apiCall('/courses');
        
        if (response.success) {
            courses = response.data.map(course => ({
                ...course,
                enrolledCount: course.enrolledUsers?.length || 0
            }));
            
            // Update UI elements
            const totalCoursesElement = document.getElementById('total-courses');
            if (totalCoursesElement) {
                totalCoursesElement.textContent = courses.length;
            }
            
            displayCourses(courses);
            populateCourseSelect();
            showToast('✅ Courses loaded successfully');
            return courses;
        } else {
            throw new Error(response.message || 'Failed to load courses');
        }
    } catch (error) {
        console.error('❌ Error loading courses:', error);
        showToast('Failed to load courses ❌', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Display courses in grid
export const displayCourses = (courseList = courses) => {
    const coursesGrid = document.getElementById('courses-grid');
    if (!coursesGrid) return;
    
    if (!courseList || courseList.length === 0) {
        coursesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>No Courses Yet</h3>
                <p>Get started by creating your first course using the "Add Course" button above.</p>
            </div>
        `;
        return;
    }
    
    coursesGrid.innerHTML = courseList.map(course => `
        <div class="course-card">
            <h3>${course.courseName || 'Untitled Course'}</h3>
            <p>${course.description || 'No description available'}</p>
            <div class="course-users">
                <i class="fas fa-users"></i>
                <span>${course.enrolledCount} enrolled users</span>
            </div>
            <div class="course-info">
                <strong>Course ID:</strong> ${course.courseId}
                ${course.createdAt ? `<br><strong>Created:</strong> ${new Date(course.createdAt).toLocaleDateString()}` : ''}
            </div>
            <div class="course-actions">
                <button class="btn btn-outline-primary" onclick="window.editCourse('${course.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-outline-danger" onclick="window.deleteCourse('${course.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
};

// Create new course through backend API
export const createCourse = async (courseData) => {
    try {
        showLoading();
        const response = await apiCall('/api/courses', {
            method: 'POST',
            body: JSON.stringify({
                courseId: courseData.courseId || `course_${Date.now()}`,
                courseName: courseData.courseName,
                description: courseData.description
            })
        });

        if (response.success) {
            const createdCourse = {
                ...response.data,
                enrolledCount: 0
            };
            
            // Add to local array
            courses.push(createdCourse);
            displayCourses(courses);
            populateCourseSelect();
            
            showToast('✅ Course created successfully');
            return createdCourse;
        } else {
            throw new Error(response.message || 'Failed to create course');
        }
    } catch (error) {
        console.error('❌ Error creating course:', error);
        showToast('Failed to create course', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Update course through backend API
export const updateCourse = async (courseId, updateData) => {
    try {
        showLoading();
        const response = await apiCall(`/api/courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (response.success) {
            // Update local array
            const courseIndex = courses.findIndex(course => course.id === courseId);
            if (courseIndex !== -1) {
                courses[courseIndex] = { 
                    ...courses[courseIndex], 
                    ...response.data,
                    enrolledCount: response.data.enrolledUsers?.length || 0
                };
                displayCourses(courses);
                populateCourseSelect();
            }
            
            showToast('✅ Course updated successfully');
            return courses[courseIndex];
        } else {
            throw new Error(response.message || 'Failed to update course');
        }
    } catch (error) {
        console.error('❌ Error updating course:', error);
        showToast('Failed to update course', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Delete course through backend API
export const deleteCourse = async (courseId) => {
    try {
        showLoading();
        const response = await apiCall(`/api/courses/${courseId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            // Remove from local array
            courses = courses.filter(course => course.id !== courseId);
            displayCourses(courses);
            populateCourseSelect();
            
            showToast('✅ Course deleted successfully');
            return true;
        } else {
            throw new Error(response.message || 'Failed to delete course');
        }
    } catch (error) {
        console.error('❌ Error deleting course:', error);
        showToast('Failed to delete course', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Get course by ID from local array
export const getCourseById = (courseId) => {
    return courses.find(course => course.id === courseId);
};

// Get course by name from local array
export const getCourseByName = (courseName) => {
    return courses.find(course => course.courseName === courseName);
};

// Search courses in local array
export const searchCourses = (searchTerm) => {
    if (!searchTerm) return courses;
    
    const term = searchTerm.toLowerCase();
    return courses.filter(course => 
        course.courseName?.toLowerCase().includes(term) ||
        course.description?.toLowerCase().includes(term) ||
        course.courseId?.toLowerCase().includes(term)
    );
};

// Filter courses based on search input
export const filterCourses = () => {
    const searchInput = document.getElementById('course-search');
    if (!searchInput) return;
    
    const filteredCourses = searchCourses(searchInput.value);
    displayCourses(filteredCourses);
};

// Populate course select dropdown
export const populateCourseSelect = () => {
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) return;
    
    const options = courses.map(course => 
        `<option value="${course.courseId}">${course.courseName}</option>`
    ).join('');
    
    courseSelect.innerHTML = '<option value="">Select Course</option>' + options;
};

// Show create course modal
export const showCreateCourseModal = () => {
    const modal = document.getElementById('create-course-modal');
    if (modal) {
        modal.style.display = 'block';
    }
};

// Handle create course form submission
export const handleCreateCourseForm = async (event) => {
    event.preventDefault();
    
    const courseName = document.getElementById('new-course-name')?.value;
    const description = document.getElementById('new-course-description')?.value;
    
    if (!courseName || !description) {
        showToast('⚠️ Please fill in all fields', 'error');
        return;
    }
    
    // Check if course already exists
    if (getCourseByName(courseName)) {
        showToast('⚠️ Course with this name already exists', 'error');
        return;
    }
    
    try {
        await createCourse({ courseName, description });
        
        // Close modal and reset form
        const modal = document.getElementById('create-course-modal');
        if (modal) modal.style.display = 'none';
        
        const form = document.getElementById('create-course-form');
        if (form) form.reset();
        
    } catch (error) {
        // Error handling is done in createCourse function
    }
};

// Get all courses from local array
export const getAllCourses = () => courses;

// Get courses count from local array
export const getCoursesCount = () => courses.length;

// Export for global access
window.editCourse = function(courseId) {
    console.log('🔍 Editing course:', courseId);
    const course = getCourseById(courseId);
    if (course) {
        // Populate edit form
        document.getElementById('edit-course-name').value = course.courseName || '';
        document.getElementById('edit-course-description').value = course.description || '';
        
        // Show edit modal
        const editModal = document.getElementById('edit-course-modal');
        if (editModal) {
            editModal.style.display = 'block';
            editModal.setAttribute('data-course-id', courseId);
        }
    }
};

window.deleteCourse = async function(courseId) {
    if (confirm('⚠️ Are you sure you want to delete this course?')) {
        try {
            await deleteCourse(courseId);
        } catch (error) {
            // Error handling is done in deleteCourse function
        }
    }
};

// Handle course creation through API
export const handleCreateCourse = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const courseName = form.querySelector('#course-name')?.value;
    const description = form.querySelector('#course-description')?.value;
    
    if (!courseName || !description) {
        showToast('⚠️ Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showLoading('📝 Creating course...');
        const response = await apiCall('/courses', {
            method: 'POST',
            body: JSON.stringify({
                courseName,
                description,
                status: 'active'
            })
        });
        
        if (response.success) {
            showToast('✅ Course created successfully');
            closeModal('create-course-modal');
            form.reset();
            await loadCourses(); // Refresh courses list
        } else {
            throw new Error(response.message || 'Failed to create course');
        }
    } catch (error) {
        console.error('❌ Error creating course:', error);
        showToast(error.message || 'Failed to create course ❌', 'error');
    } finally {
        hideLoading();
    }
};

// Remove course through API
export const removeCourse = async (courseId) => {
    if (!confirm('⚠️ Are you sure you want to remove this course?')) {
        return;
    }
    
    try {
        showLoading('🗑️ Removing course...');
        const response = await apiCall(`/courses/${courseId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast('✅ Course removed successfully');
            await loadCourses(); // Refresh courses list
        } else {
            throw new Error(response.message || 'Failed to remove course');
        }
    } catch (error) {
        console.error('❌ Error removing course:', error);
        showToast(error.message || 'Failed to remove course ❌', 'error');
    } finally {
        hideLoading();
    }
};