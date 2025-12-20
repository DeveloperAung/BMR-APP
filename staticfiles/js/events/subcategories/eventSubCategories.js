import { EventSubCategoryManager } from './managers/SubCategoryManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class EventSubCategoryApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.eventSubCategoryManager = null;
    }

    async init() {
        try {
            this.eventSubCategoryManager = new EventSubCategoryManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.eventSubCategoryManager.init();
            this.setupEventListeners();
        } catch (error) {
            this.notificationService.showError('Failed to initialize subcategory management', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-subcategory"]')) {
                this.eventSubCategoryManager.viewCategory(e.target.dataset.subcategoryId);
            } else if (e.target.matches('[data-action="edit-subcategory"]')) {
                this.eventSubCategoryManager.editCategory(e.target.dataset.subcategoryId);
            } else if (e.target.matches('[data-action="delete-subcategory"]')) {
                this.eventSubCategoryManager.toggleStatus(e.target.dataset.subcategoryId, false, 'Are you sure you want to deactivate category ' + e.target.dataset.title + '?');
            }
        });
    }
}
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new EventSubCategoryApp();
    app.init();
});