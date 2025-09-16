import { SubCategoryManager } from './managers/SubCategoryManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class SubCategoryApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.subCategoryManager = null;
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

            // Initialize subcategory manager
            this.subCategoryManager = new SubCategoryManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.subCategoryManager.init();
        } catch (error) {
            this.notificationService.showError('Failed to initialize subcategory management', error);
        }
    }

    showLoginRequired() {
        document.getElementById('donationSubCategoriesTableBody').innerHTML = `
            <tr><td colspan="6" class="text-center p-4">
                <div class="alert alert-warning">
                    <h4>Authentication Required</h4>
                    <p>Please log in to access subcategory management.</p>
                    <a href="/login/" class="btn btn-primary">Go to Login</a>
                </div>
            </td></tr>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new SubCategoryApp();
    app.init();
});