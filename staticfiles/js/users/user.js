// static/js/users/dashboard.js (Main entry point)
import { UsersManager } from './managers/UsersManager.js';
import { NotificationService } from '../shared/services/NotificationService.js';
import { AuthService } from '../shared/services/AuthService.js';

class UserApp {
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
    const app = new UserApp();

    app.init();
});
