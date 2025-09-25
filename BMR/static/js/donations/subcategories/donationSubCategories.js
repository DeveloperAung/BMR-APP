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

            if (!await this.authService.isAuthenticated()) {
                this.showLoginRequired();
                return;
            }

            // Initialize subcategory manager
            this.subCategoryManager = new SubCategoryManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.subCategoryManager.init();
            this.setupEventListeners();
        } catch (error) {
            this.notificationService.showError('Failed to initialize subcategory management', error);
        }
    }


    setupEventListeners() {
        // Use event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.getAttribute('data-action');
            const subcategoryId = target.getAttribute('data-subcategory-id');
            const title = target.getAttribute('data-title');

            switch (action) {
                case 'view-subcategory':
                    this.subCategoryManager.viewCategory(e.target.dataset.categoryId);
                    break;
                case 'edit-subcategory':
                    this.subCategoryManager.editSubCategory(subcategoryId);
                    break;
                case 'delete-subcategory':
                    this.subCategoryManager.toggleStatus(subcategoryId, false, 'Are you sure you want to deactivate subcategory ' + title + '?');
                    break;
            }
        });
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