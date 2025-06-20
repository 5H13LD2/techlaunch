// Dashboard API Service (simulating your backend dashboardService)
class DashboardAPI {
    constructor() {
        this.baseURL = '/api/dashboard'; // Replace with your actual API endpoint
    }

    // Simulate API call to get dashboard stats
    async getDashboardStats() {
        try {
            // Simulate API delay
            await this.delay(1000);
            
            // Simulated response based on your dashboardService structure
            return {
                success: true,
                data: {
                    users: {
                        total: 1204,
                        active: 897
                    },
                    courses: {
                        total: 12,
                        published: 8
                    },
                    modules: {
                        total: 45
                    },
                    lessons: {
                        total: 156
                    },
                    quizzes: {
                        total: 89,
                        active: 76
                    },
                    enrollments: {
                        total: 2847,
                        active: 1923
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw new Error('Failed to fetch dashboard statistics');
        }
    }

    // Simulate API call to get analytics
    async getAnalytics() {
        try {
            await this.delay(800);
            
            return {
                success: true,
                data: {
                    courses: {
                        totalCourses: 12,
                        publishedCourses: 8,
                        totalEnrollments: 2847,
                        courseStats: [
                            { id: 1, title: 'Java Fundamentals', enrollmentCount: 654, completionRate: 78, averageRating: 4.5 },
                            { id: 2, title: 'Python Basics', enrollmentCount: 891, completionRate: 85, averageRating: 4.7 },
                            { id: 3, title: 'SQL Essentials', enrollmentCount: 423, completionRate: 68, averageRating: 4.2 },
                            { id: 4, title: 'JavaScript Advanced', enrollmentCount: 512, completionRate: 72, averageRating: 4.4 },
                            { id: 5, title: 'React Development', enrollmentCount: 389, completionRate: 81, averageRating: 4.6 }
                        ]
                    },
                    modules: {
                        totalModules: 45,
                        averageLessonsPerModule: 3.5,
                        moduleStats: [
                            { id: 1, title: 'Java Basics', lessonCount: 8, averageCompletionTime: 45 },
                            { id: 2, title: 'Python Fundamentals', lessonCount: 6, averageCompletionTime: 38 },
                            { id: 3, title: 'SQL Queries', lessonCount: 5, averageCompletionTime: 52 }
                        ]
                    },
                    lessons: {
                        totalLessons: 156,
                        lessonsWithQuizzes: 89,
                        lessonStats: [
                            { id: 1, title: 'Variables and Data Types', quizCount: 2, averageQuizScore: 85 },
                            { id: 2, title: 'Control Structures', quizCount: 3, averageQuizScore: 78 },
                            { id: 3, title: 'Functions and Methods', quizCount: 2, averageQuizScore: 82 }
                        ]
                    },
                    quizzes: {
                        totalQuizzes: 89,
                        totalAttempts: 15634,
                        averageScore: 82.3,
                        quizStats: [
                            { id: 1, title: 'Java Basics Quiz', attemptCount: 1245, averageScore: 84, passRate: 78 },
                            { id: 2, title: 'Python Functions Quiz', attemptCount: 1567, averageScore: 81, passRate: 85 },
                            { id: 3, title: 'SQL Advanced Quiz', attemptCount: 892, averageScore: 79, passRate: 68 }
                        ]
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw new Error('Failed to fetch analytics');
        }
    }

    // Simulate API call to get recent activity
    async getRecentActivity() {
        try {
            await this.delay(600);
            
            return {
                success: true,
                data: [
                    {
                        type: 'enrollment',
                        message: 'Jerico enrolled in Java Fundamentals',
                        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                        userId: 'user123'
                    },
                    {
                        type: 'quiz',
                        message: 'Miguel completed SQL Quiz 2 with 95% score',
                        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
                        userId: 'user456'
                    },
                    {
                        type: 'lesson',
                        message: 'Ella finished Python Module 3 - Functions',
                        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                        userId: 'user789'
                    },
                    {
                        type: 'quiz',
                        message: 'Hannah scored 100% in Java Quiz 1',
                        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                        userId: 'user101'
                    },
                    {
                        type: 'course',
                        message: 'New course "Advanced SQL" was published',
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        userId: 'admin'
                    },
                    {
                        type: 'enrollment',
                        message: 'Kyle enrolled in React Development',
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        userId: 'user202'
                    },
                    {
                        type: 'lesson',
                        message: 'Sarah completed JavaScript Advanced Module 1',
                        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        userId: 'user303'
                    }
                ]
            };
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            throw new Error('Failed to fetch recent activity');
        }
    }

    // Simulate API call to get latest users
    async getLatestUsers() {
        try {
            await this.delay(500);
            
            return {
                success: true,
                data: [
                    { id: 1, username: 'jerico_dev', email: 'jerico@techlaunch.com', isActive: true, createdAt: '2025-06-19T10:30:00Z' },
                    { id: 2, username: 'miguel_data', email: 'miguel@techlaunch.com', isActive: true, createdAt: '2025-06-19T09:15:00Z' },
                    { id: 3, username: 'ella_python', email: 'ella@techlaunch.com', isActive: true, createdAt: '2025-06-18T16:45:00Z' },
                    { id: 4, username: 'hannah_java', email: 'hannah@techlaunch.com', isActive: true, createdAt: '2025-06-18T14:20:00Z' },
                    { id: 5, username: 'kyle_fullstack', email: 'kyle@techlaunch.com', isActive: false, createdAt: '2025-06-17T11:30:00Z' },
                    { id: 6, username: 'sarah_react', email: 'sarah@techlaunch.com', isActive: true, createdAt: '2025-06-17T08:45:00Z' },
                    { id: 7, username: 'alex_backend', email: 'alex@techlaunch.com', isActive: true, createdAt: '2025-06-16T14:30:00Z' }
                ]
            };
        } catch (error) {
            console.error('Error fetching latest users:', error);
            throw new Error('Failed to fetch latest users');
        }
    }

    // Simulate API call to get user milestones
    async getUserMilestones() {
        try {
            await this.delay(400);
            
            return {
                success: true,
                data: [
                    { username: 'Miguel', achievement: 'SQL Master', progress: 100, streak: 15 },
                    { username: 'Ella', achievement: 'Python Pro', progress: 85, streak: 8 },
                    { username: 'Hannah', achievement: 'Java Expert', progress: 92, streak: 12 },
                    { username: 'Jerico', achievement: 'Full Stack', progress: 67, streak: 5 }
                ]
            };
        } catch (error) {
            console.error('Error fetching user milestones:', error);
            throw new Error('Failed to fetch user milestones');
        }
    }

    // Utility method to simulate network delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main Dashboard Class
class Dashboard {
    constructor() {
        this.api = new DashboardAPI();
        this.init();
    }

    async init() {
        try {
            // Show loading states
            this.showLoadingStates();
            
            // Load all dashboard data
            await Promise.all([
                this.loadDashboardStats(),
                this.loadAnalytics(),
                this.loadRecentActivity(),
                this.loadLatestUsers(),
                this.loadUserMilestones()
            ]);

            // Hide loading states
            this.hideLoadingStates();

            // Initialize event listeners
            this.initializeEventListeners();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Failed to load dashboard data. Please refresh the page.');
        }
    }

    showLoadingStates() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(el => el.style.display = 'flex');
    }

    hideLoadingStates() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(el => el.style.display = 'none');
    }

    async loadDashboardStats() {
        try {
            const response = await this.api.getDashboardStats();
            
            if (response.success) {
                this.updateStatsCards(response.data);
                this.updateTerminalStats(response.data);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.showError('Failed to load dashboard statistics');
        }
    }

    async loadAnalytics() {
        try {
            const response = await this.api.getAnalytics();
            
            if (response.success) {
                this.updateTerminalAnalytics(response.data);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    async loadRecentActivity() {
        try {
            const response = await this.api.getRecentActivity();
            
            if (response.success) {
                this.renderActivity(response.data);
                this.updateTerminalActivity(response.data);
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
            this.showActivityError();
        }
    }

    async loadLatestUsers() {
        try {
            const response = await this.api.getLatestUsers();
            
            if (response.success) {
                this.renderUsers(response.data);
            }
        } catch (error) {
            console.error('Error loading latest users:', error);
            this.showUsersError();
        }
    }

    async loadUserMilestones() {
        try {
            const response = await this.api.getUserMilestones();
            
            if (response.success) {
                this.updateUserMilestones(response.data);
            }
        } catch (error) {
            console.error('Error loading user milestones:', error);
        }
    }

    updateStatsCards(data) {
        // Update main stats cards
        const totalUsers = document.getElementById('total-users');
        const totalCourses = document.getElementById('total-courses');
        const totalEnrollments = document.getElementById('total-enrollments');
        const completionRate = document.getElementById('completion-rate');

        if (totalUsers) totalUsers.textContent = data.users.total.toLocaleString();
        if (totalCourses) totalCourses.textContent = data.courses.total;
        if (totalEnrollments) totalEnrollments.textContent = data.enrollments.total.toLocaleString();
        
        // Calculate completion rate
        const rate = data.enrollments.total > 0 
            ? Math.round((data.enrollments.active / data.enrollments.total) * 100)
            : 0;
        if (completionRate) completionRate.textContent = rate + '%';
    }

    updateTerminalStats(data) {
        // Update terminal overview with actual data
        const terminalUsers = document.getElementById('terminal-users');
        const terminalCourses = document.getElementById('terminal-courses');
        const terminalEnrolled = document.getElementById('terminal-enrolled');

        if (terminalUsers) terminalUsers.textContent = data.users.total.toLocaleString();
        if (terminalCourses) terminalCourses.textContent = data.courses.total;
        if (terminalEnrolled) terminalEnrolled.textContent = data.enrollments.total.toLocaleString();
    }

    updateTerminalAnalytics(data) {
        // Update active learners section
        const activeLearners = document.getElementById('active-learners-content');
        if (activeLearners && data.courses && data.courses.courseStats) {
            const courseData = data.courses.courseStats.slice(0, 3).map(course => 
                `${course.title.split(' ')[0]} + ${course.enrollmentCount}`
            ).join(' | ');
            
            const avgScore = data.quizzes ? data.quizzes.averageScore : 82;
            activeLearners.innerHTML = `
                <div>${courseData}</div>
                <div>Avg Streak: 8.2 | Avg Score: ${Math.round(avgScore)}%</div>
            `;
        }

        // Update course snapshot
        const courseSnapshot = document.getElementById('course-snapshot');
        if (courseSnapshot && data.courses && data.courses.courseStats) {
            courseSnapshot.innerHTML = data.courses.courseStats.slice(0, 3).map(course => `
                <div>
                    <div style="color: ${this.getCourseColor(course.title)}; font-weight: bold; margin-bottom: 5px;">
                        ${course.title.split(' ')[0].toUpperCase()}
                    </div>
                    <div>Users: ${course.enrollmentCount}</div>
                    <div>Completion: ${Math.round(course.completionRate)}%</div>
                    <div>Rating: ${course.averageRating}/5</div>
                </div>
            `).join('');
        }
    }

    updateTerminalActivity(activities) {
        const terminalLog = document.getElementById('terminal-activity-log');
        if (terminalLog && activities.length > 0) {
            terminalLog.innerHTML = activities.slice(0, 5).map(activity => {
                const timeAgo = this.getTimeAgo(activity.timestamp);
                const icon = this.getActivityIcon(activity.type);
                return `<div>${icon} ${activity.message} - ${timeAgo}</div>`;
            }).join('');
        }
    }

    updateUserMilestones(milestones) {
        const milestonesContainer = document.getElementById('user-milestones');
        if (milestonesContainer && milestones.length > 0) {
            milestonesContainer.innerHTML = milestones.map(milestone => `
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>${milestone.username} - ${milestone.achievement}</span>
                        <span>${milestone.progress}% | ${milestone.streak} day streak</span>
                    </div>
                </div>
            `).join('');
        }
    }

    renderActivity(activities) {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        if (activities.length === 0) {
            activityList.innerHTML = '<div class="no-data">No recent activity found.</div>';
            return;
        }

        activityList.innerHTML = activities.map(activity => {
            const timeAgo = this.getTimeAgo(activity.timestamp);
            const icon = this.getActivityIcon(activity.type);
            const iconClass = this.getActivityIconClass(activity.type);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon ${iconClass}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-message">${activity.message}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderUsers(users) {
        const usersTableBody = document.getElementById('users-table-body');
        if (!usersTableBody) return;

        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="3">No users found.</td></tr>';
            return;
        }

        usersTableBody.innerHTML = users.map(user => {
            const statusClass = user.isActive ? 'status-active' : 'status-inactive';
            const statusText = user.isActive ? 'Active' : 'Inactive';
            
            return `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');
    }

    // Helper methods
    getCourseColor(courseTitle) {
        const colors = {
            'Java': '#ff6b35',
            'Python': '#3776ab',
            'SQL': '#336791',
            'JavaScript': '#f7df1e',
            'React': '#61dafb'
        };
        
        const courseName = courseTitle.split(' ')[0];
        return colors[courseName] || '#00ff41';
    }

    getActivityIcon(type) {
        const icons = {
            'enrollment': 'fas fa-user-plus',
            'quiz': 'fas fa-question-circle',
            'lesson': 'fas fa-play-circle',
            'course': 'fas fa-book',
            'module': 'fas fa-cube'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    getActivityIconClass(type) {
        const classes = {
            'enrollment': 'icon-blue',
            'quiz': 'icon-purple',
            'lesson': 'icon-green',
            'course': 'icon-orange',
            'module': 'icon-red'
        };
        return classes[type] || 'icon-gray';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds} seconds ago`;
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }

    showError(message) {
        // You can implement a toast notification or modal here
        console.error(message);
        alert(message);
    }

    showActivityError() {
        const activityList = document.getElementById('activity-list');
        if (activityList) {
            activityList.innerHTML = '<div class="error-message">Failed to load recent activity. Please try again.</div>';
        }
    }

    showUsersError() {
        const usersTableBody = document.getElementById('users-table-body');
        if (usersTableBody) {
            usersTableBody.innerHTML = '<tr><td colspan="3" class="error-message">Failed to load users. Please try again.</td></tr>';
        }
    }

    initializeEventListeners() {
        // Terminal controls
        const copyBtn = document.getElementById('copy-btn');
        const editBtn = document.getElementById('edit-btn');
        const addUserBtn = document.getElementById('add-user-btn');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyTerminalContent();
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.toggleEditMode();
            });
        }

        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showAddUserModal();
            });
        }

        // Auto-refresh dashboard every 5 minutes
        setInterval(() => {
            this.refreshDashboard();
        }, 5 * 60 * 1000);
    }

    copyTerminalContent() {
        const terminalContent = document.querySelector('.terminal-content');
        if (terminalContent) {
            const text = terminalContent.innerText;
            navigator.clipboard.writeText(text).then(() => {
                console.log('Terminal content copied to clipboard');
                // You can show a success message here
            }).catch(err => {
                console.error('Failed to copy terminal content:', err);
            });
        }
    }

    toggleEditMode() {
        // Placeholder for edit mode functionality
        console.log('Edit mode toggle - implement as needed');
    }

    showAddUserModal() {
        // Placeholder for add user modal
        console.log('Add user modal - implement as needed');
    }

    async refreshDashboard() {
        try {
            console.log('Refreshing dashboard data...');
            await this.init();
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});