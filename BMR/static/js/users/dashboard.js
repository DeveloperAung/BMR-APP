// static/js/users/dashboard.js (Main entry point)
import { UsersManager } from './managers/UsersManager.js';
import { NotificationService } from '../shared/services/NotificationService.js';
import { AuthService } from '../shared/services/AuthService.js';

class DashboardApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.usersManager = null;
    }

    async init() {
        try {
            // TEMP BYPASS: Disable auth check during development
            // REMOVE THIS BEFORE PRODUCTION
            console.warn('⚠️ Auth check bypassed for development');
            // if (!await this.authService.isAuthenticated()) {
            //     this.showLoginRequired();
            //     return;
            // }

            // Initialize users manager
            this.usersManager = new UsersManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.usersManager.init();
        } catch (error) {
            this.notificationService.showError('Failed to initialize dashboard', error);
        }
    }

    showLoginRequired() {
        document.getElementById('usersTableBody').innerHTML = `
            <tr><td colspan="8" class="text-center p-4">
                <div class="alert alert-warning">
                    <h4>Authentication Required</h4>
                    <p>Please log in to access user management.</p>
                    <a href="/login/" class="btn btn-primary">Go to Login</a>
                </div>
            </td></tr>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new DashboardApp();

    // Test util
    window.testUserLoad = async function () {
        console.log('🧪 Testing user load...');
        console.log('🚀 dashboard.js loaded');
        try {
            const tbody = document.getElementById('usersTableBody');
            const spinner = document.getElementById('loadingSpinner');
            console.log('DOM Elements:', { tbody: !!tbody, spinner: !!spinner });

            const token = localStorage.getItem('access_token');
            console.log('Token present:', !!token);

            const response = await fetch('/api/auth/users/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const responseData = await response.json();
                const users = responseData?.data?.results;
                console.log('response users:', users)
                if (tbody && Array.isArray(users)) {
                    tbody.innerHTML = users.map(user => `
                        <tr>
                            <td colspan="8">${user.email || user.username || 'Unknown User'}</td>
                        </tr>
                    `).join('');
                } else {
                    console.warn('❌ No users found in response:', responseData);
                }
            } else {
                console.error('API Error:', await response.text());
            }

        } catch (error) {
            console.error('Test failed:', error);
        }
    };

    // Run test and init app
    window.testUserLoad();
    app.init();
});
