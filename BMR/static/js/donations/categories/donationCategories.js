import { CategoryManager } from './managers/CategoryManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class CategoryApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.categoryManager = null;
    }

    async init() {
        try {
             if (!await this.authService.isAuthenticated()) {
                 this.showLoginRequired();
                 return;
             }

            // Initialize category manager
            this.categoryManager = new CategoryManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.categoryManager.init();
        } catch (error) {
            this.notificationService.showError('Failed to initialize category management', error);
        }
    }

    showLoginRequired() {
        document.getElementById('donationCategoriesTableBody').innerHTML = `
            <tr><td colspan="5" class="text-center p-4">
                <div class="alert alert-warning">
                    <h4>Authentication Required</h4>
                    <p>Please log in to access category management.</p>
                    <a href="/login/" class="btn btn-primary">Go to Login</a>
                </div>
            </td></tr>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new CategoryApp();

    app.init();
});