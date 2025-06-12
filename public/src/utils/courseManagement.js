//================
//userManagement.js
//================

import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './api.js';
import { showLoading, hideLoading, showToast } from './display.js';

let users = [];

// Load all users from Firebase
export const loadUsers = async () => {
    try {
        showLoading();
        const usersSnapshot = await getDocs(collection(db, 'users'));
        users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            users.push({ 
                id: doc.id, 
                ...userData,
                coursesCount: userData.courseTaken ? userData.courseTaken.length : 0
            });
        });
        
        // Update UI elements
        const totalUsersElement = document.getElementById('total-users');
        if (totalUsersElement) {
            totalUsersElement.textContent = users.length;
        }
        
        displayUsers(users);
        populateUserSelect();
        showToast('Users loaded successfully');
        return users;
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Display users in table
export const displayUsers = (userList = users) => {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;
    
    if (!userList || userList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = userList.map(user => `
        <tr>
            <td>${user.email || 'N/A'}</td>
            <td>${user.username || 'N/A'}</td>
            <td>
                <div class="user-courses">
                    ${(user.courseTaken || []).map(course => 
                        `<span class="course-tag">${course}</span>`
                    ).join('')}
                    <small>(${user.coursesCount} courses)</small>
                </div>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="window.editUser('${user.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="window.deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
};

// Create new user
export const createUser = async (userData) => {
    try {
        showLoading();
        const newUser = {
            username: userData.username,
            email: userData.email,
            createdAt: new Date().toISOString(),
            courseTaken: [],
            isEnrolled: false,
            lastEnrollmentTime: null,
            ...userData
        };
        
        const docRef = await addDoc(collection(db, 'users'), newUser);
        const createdUser = { id: docRef.id, ...newUser };
        
        // Add to local array
        users.push(createdUser);
        displayUsers(users);
        populateUserSelect();
        
        showToast('User created successfully');
        return createdUser;
    } catch (error) {
        console.error('Error creating user:', error);
        showToast('Failed to create user', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Update user
export const updateUser = async (userId, updateData) => {
    try {
        showLoading();
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        
        // Update local array
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updateData };
            displayUsers(users);
            populateUserSelect();
        }
        
        showToast('User updated successfully');
        return users[userIndex];
    } catch (error) {
        console.error('Error updating user:', error);
        showToast('Failed to update user', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Delete user
export const deleteUser = async (userId) => {
    try {
        showLoading();
        await deleteDoc(doc(db, 'users', userId));
        
        // Remove from local array
        users = users.filter(user => user.id !== userId);
        displayUsers(users);
        populateUserSelect();
        
        showToast('User deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Get user by ID
export const getUserById = (userId) => {
    return users.find(user => user.id === userId);
};

// Get user by email
export const getUserByEmail = (email) => {
    return users.find(user => user.email === email);
};

// Search users
export const searchUsers = (searchTerm) => {
    if (!searchTerm) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
        user.username?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        (user.courseTaken || []).some(course => course.toLowerCase().includes(term))
    );
};

// Filter users
export const filterUsers = () => {
    const searchInput = document.getElementById('user-search');
    if (!searchInput) return;
    
    const filteredUsers = searchUsers(searchInput.value);
    displayUsers(filteredUsers);
};

// Populate user select dropdown
export const populateUserSelect = () => {
    const userSelect = document.getElementById('user-select');
    if (!userSelect) return;
    
    const options = users.map(user => 
        `<option value="${user.email}">${user.username} (${user.email})</option>`
    ).join('');
    
    userSelect.innerHTML = '<option value="">Select User</option>' + options;
};

// Show create user modal
export const showCreateUserModal = () => {
    const modal = document.getElementById('create-user-modal');
    if (modal) {
        modal.style.display = 'block';
    }
};

// Handle create user form submission
export const handleCreateUserForm = async (event) => {
    event.preventDefault();
    
    const username = document.getElementById('new-username')?.value;
    const email = document.getElementById('new-email')?.value;
    
    if (!username || !email) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Check if user already exists
    if (getUserByEmail(email)) {
        showToast('User with this email already exists', 'error');
        return;
    }
    
    try {
        await createUser({ username, email });
        
        // Close modal and reset form
        const modal = document.getElementById('create-user-modal');
        if (modal) modal.style.display = 'none';
        
        const form = document.getElementById('create-user-form');
        if (form) form.reset();
        
    } catch (error) {
        // Error handling is done in createUser function
    }
};

// Get all users
export const getAllUsers = () => users;

// Get users count
export const getUsersCount = () => users.length;

// Export for global access
window.editUser = function(userId) {
    console.log('Editing user:', userId);
    const user = getUserById(userId);
    if (user) {
        // Populate edit form
        document.getElementById('edit-username').value = user.username || '';
        document.getElementById('edit-email').value = user.email || '';
        
        // Show edit modal
        const editModal = document.getElementById('edit-user-modal');
        if (editModal) {
            editModal.style.display = 'block';
            editModal.setAttribute('data-user-id', userId);
        }
    }
};

window.deleteUser = async function(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await deleteUser(userId);
        } catch (error) {
            // Error handling is done in deleteUser function
        }
    }
};

//================
//courseManagement.js
//================

import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './api.js';
import { showLoading, hideLoading, showToast } from './display.js';
import { apiCall } from './api.js';
import { showToast as domShowToast, closeModal } from './dom.js';
import { fetchCourses, courses } from './dataManager.js';

let courses = [];
let currentCourse = null;

// Load all courses from Firebase
export const loadCourses = async () => {
    try {
        showLoading();
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        courses = [];
        coursesSnapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });
        
        // Update UI elements
        const totalCoursesElement = document.getElementById('total-courses');
        if (totalCoursesElement) {
            totalCoursesElement.textContent = courses.length;
        }
        
        displayCourses(courses);
        populateCourseSelect();
        showToast('Courses loaded successfully');
        return courses;
    } catch (error) {
        console.error('Error loading courses:', error);
        showToast('Failed to load courses', 'error');
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
        coursesGrid.innerHTML = '<p>No courses found</p>';
        return;
    }
    
    coursesGrid.innerHTML = courseList.map(course => `
        <div class="course-card">
            <h3>${course.courseName || course.name || 'Untitled Course'}</h3>
            <p>${course.description || 'No description available'}</p>
            <div class="course-info">
                <strong>Course ID:</strong> ${course.courseId || course.id}<br>
                <strong>Enrolled Users:</strong> ${(course.enrolledUsers || []).length}<br>
                <strong>Created:</strong> ${course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
            </div>
            <div class="course-actions">
                <button class="btn btn-primary btn-sm" onclick="window.viewModules('${course.id}')">
                    <i class="fas fa-cubes"></i> Modules
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.editCourse('${course.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="window.deleteCourse('${course.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
};

// Create new course
export const createCourse = async (courseData) => {
    try {
        showLoading();
        const newCourse = {
            courseId: courseData.courseId,
            courseName: courseData.courseName,
            description: courseData.description,
            createdAt: new Date().toISOString(),
            enrolledUsers: [],
            modules: [],
            ...courseData
        };
        
        const docRef = await addDoc(collection(db, 'courses'), newCourse);
        const createdCourse = { id: docRef.id, ...newCourse };
        
        // Add to local array
        courses.push(createdCourse);
        displayCourses(courses);
        populateCourseSelect();
        
        showToast('Course created successfully');
        return createdCourse;
    } catch (error) {
        console.error('Error creating course:', error);
        showToast('Failed to create course', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Update course
export const updateCourse = async (courseId, updateData) => {
    try {
        showLoading();
        const courseRef = doc(db, 'courses', courseId);
        await updateDoc(courseRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        
        // Update local array
        const courseIndex = courses.findIndex(course => course.id === courseId);
        if (courseIndex !== -1) {
            courses[courseIndex] = { ...courses[courseIndex], ...updateData };
            displayCourses(courses);
            populateCourseSelect();
        }
        
        showToast('Course updated successfully');
        return courses[courseIndex];
    } catch (error) {
        console.error('Error updating course:', error);
        showToast('Failed to update course', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Delete course
export const deleteCourse = async (courseId) => {
    try {
        showLoading();
        await deleteDoc(doc(db, 'courses', courseId));
        
        // Remove from local array
        courses = courses.filter(course => course.id !== courseId);
        displayCourses(courses);
        populateCourseSelect();
        
        showToast('Course deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting course:', error);
        showToast('Failed to delete course', 'error');
        throw error;
    } finally {
        hideLoading();
    }
};

// Get course by ID
export const getCourseById = (courseId) => {
    return courses.find(course => course.id === courseId);
};

// Get course by name
export const getCourseByName = (courseName) => {
    return courses.find(course => course.courseName === courseName || course.name === courseName);
};

// Search courses
export const searchCourses = (searchTerm) => {
    if (!searchTerm) return courses;
    
    const term = searchTerm.toLowerCase();
    return courses.filter(course => 
        course.courseName?.toLowerCase().includes(term) ||
        course.name?.toLowerCase().includes(term) ||
        course.description?.toLowerCase().includes(term) ||
        course.courseId?.toLowerCase().includes(term)
    );
};

// Populate course select dropdown
export const populateCourseSelect = () => {
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) return;
    
    const options = courses.map(course => 
        `<option value="${course.courseName || course.name}">${course.courseName || course.name}</option>`
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
    
    const courseId = document.getElementById('new-course-id')?.value;
    const courseName = document.getElementById('new-course-name')?.value;
    const description = document.getElementById('new-course-description')?.value;
    
    if (!courseId || !courseName || !description) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Check if course already exists
    if (getCourseByName(courseName)) {
        showToast('Course with this name already exists', 'error');
        return;
    }
    
    try {
        await createCourse({ courseId, courseName, description });
        
        // Close modal and reset form
        const modal = document.getElementById('create-course-modal');
        if (modal) modal.style.display = 'none';
        
        const form = document.getElementById('create-course-form');
        if (form) form.reset();
        
    } catch (error) {
        // Error handling is done in createCourse function
    }
};

// Set current course
export const setCurrentCourse = (courseId) => {
    currentCourse = courseId;
};

// Get current course
export const getCurrentCourse = () => currentCourse;

// Get all courses
export const getAllCourses = () => courses;

// Get courses count
export const getCoursesCount = () => courses.length;

// Export for global access
window.viewModules = function(courseId) {
    console.log('Viewing modules for course:', courseId);
    setCurrentCourse(courseId);
    const { showPage } = require('./navigation.js');
    showPage('modules');
    const { loadModules } = require('./moduleManagement.js');
    loadModules(courseId);
};

window.editCourse = function(courseId) {
    console.log('Editing course:', courseId);
    const course = getCourseById(courseId);
    if (course) {
        // Populate edit form
        document.getElementById('edit-course-id').value = course.courseId || '';
        document.getElementById('edit-course-name').value = course.courseName || course.name || '';
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
    if (confirm('Are you sure you want to delete this course? This will also remove it from all enrolled users.')) {
        try {
            await deleteCourse(courseId);
        } catch (error) {
            // Error handling is done in deleteCourse function
        }
    }
};

// ================
// courseManagement.js
// ================
// Course Management Operations

/**
 * Handle course creation form submission
 * @param {Event} event - Form submission event
 */
export const handleCreateCourse = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const courseId = form.querySelector('#course-id').value;
    const courseName = form.querySelector('#course-name').value;
    const description = form.querySelector('#course-description').value;
    
    try {
        const response = await apiCall('/courses', {
            method: 'POST',
            body: JSON.stringify({
                courseId,
                courseName,
                description
            })
        });
        
        if (response.success) {
            showToast('Course created successfully');
            closeModal('create-course-modal');
            form.reset();
            await fetchCourses(); // Refresh courses list
        }
    } catch (error) {
        console.error('Error creating course:', error);
        showToast(error.message || 'Failed to create course', 'error');
    }
};

/**
 * Remove course by ID
 * @param {string} courseId - Course ID to remove
 */
export const removeCourse = async (courseId) => {
    if (!confirm('Are you sure you want to remove this course?')) {
        return;
    }
    
    try {
        const course = courses.find(c => c.id === courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        
        await apiCall(`/courses/${courseId}`, {
            method: 'DELETE'
        });
        
        showToast('Course removed successfully');
        await fetchCourses(); // Refresh courses list
    } catch (error) {
        console.error('Error removing course:', error);
        showToast(error.message || 'Failed to remove course', 'error');
    }
};

/**
 * Enroll user in course
 */
export const enrollUser = async () => {
    const userSelect = document.getElementById('user-select');
    const courseSelect = document.getElementById('course-select');
    
    if (!userSelect || !courseSelect) return;
    
    const email = userSelect.value;
    const courseName = courseSelect.value;
    
    if (!email || !courseName) {
        showToast('Please select both user and course', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/enroll', {
            method: 'POST',
            body: JSON.stringify({
                email,
                courseName
            })
        });
        
        if (response.success) {
            showToast('User enrolled successfully');
            userSelect.value = '';
            courseSelect.value = '';
            await Promise.all([
                fetchUsers(),
                fetchCourses()
            ]);
        }
    } catch (error) {
        console.error('Error enrolling user:', error);
        showToast(error.message || 'Failed to enroll user', 'error');
    }
};