import { CategoryManager } from './managers/CategoryManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class CategoryApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.dnCategoryManager = null;
    }

    async init() {
        try {
             if (!await this.authService.isAuthenticated()) {
                 this.showLoginRequired();
                 return;
             }

            this.dnCategoryManager = new CategoryManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.dnCategoryManager.init();
            this.setupEventListeners();
        } catch (error) {
            this.notificationService.showError('Failed to initialize category management', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-category"]')) {
                this.dnCategoryManager.viewCategory(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="edit-category"]')) {
                this.dnCategoryManager.editCategory(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="delete-category"]')) {
                this.dnCategoryManager.toggleStatus(e.target.dataset.categoryId, false, 'Are you sure you want to deactivate category ' + e.target.dataset.title + '?');
            }
        });
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

document.addEventListener('DOMContentLoaded', () => {
    const app = new CategoryApp();
    app.init();
});