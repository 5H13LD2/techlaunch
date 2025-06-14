import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './api.js';
import { showLoading, hideLoading, showToast } from './display.js';
import { apiCall } from './api.js';
import { showToast as domShowToast, closeModal } from './dom.js';
import { fetchUsers, users } from './dataManager.js';

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

/**
 * Handle user creation form submission
 * @param {Event} event - Form submission event
 */
export const handleCreateUser = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const userId = form.querySelector('#user-id').value;
    const username = form.querySelector('#username').value;
    const email = form.querySelector('#user-email').value;
    
    try {
        const response = await apiCall('/users', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                username,
                email
            })
        });
        
        if (response.success) {
            showToast('User created successfully');
            closeModal('create-user-modal');
            form.reset();
            await fetchUsers(); // Refresh users list
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showToast(error.message || 'Failed to create user', 'error');
    }
};

/**
 * Remove user by ID
 * @param {string} userId - User ID to remove
 */
export const removeUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user?')) {
        return;
    }
    
    try {
        const user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        await apiCall(`/users/${userId}`, {
            method: 'DELETE'
        });
        
        showToast('User removed successfully');
        await fetchUsers(); // Refresh users list
    } catch (error) {
        console.error('Error removing user:', error);
        showToast(error.message || 'Failed to remove user', 'error');
    }
};