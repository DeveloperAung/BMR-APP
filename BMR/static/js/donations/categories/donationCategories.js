import { CategoryManager } from './managers/CategoryManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';
import { ApiErrorHandler } from '../../shared/services/ApiErrorHandler.js';

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

            this.categoryManager = new CategoryManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.categoryManager.init();

            document.addEventListener('click', async (e) => {
                const btn = e.target.closest('[data-action="delete-category"]');
                if (!btn) return;

                const categoryId = btn.dataset.categoryId;
                const title = btn.dataset.title;

                if (!confirm(`Are you sure you want to deactivate category "${title}"?`)) {
                    return;
                }

                try {
                    const updated = await this.categoryManager.toggleCategoryStatus(categoryId, false);

                    const row = btn.closest('tr');
                    if (row) {
                        const statusCell = row.querySelector('[data-field="is_active"]');
                        if (statusCell) {
                            statusCell.textContent = updated.is_active ? 'Active' : 'Inactive';
                            statusCell.className = updated.is_active ? 'text-success' : 'text-danger';
                        }

                        btn.disabled = true;
                        btn.title = "Already deactivated";
                    }

                } catch (error) {
                    ApiErrorHandler.handle(error, this.notificationService);
                }
            });
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

document.addEventListener('DOMContentLoaded', () => {
    const app = new CategoryApp();
    app.init();
});