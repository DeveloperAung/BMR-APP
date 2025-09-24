import { EventCategoryManager } from './managers/CategoryManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class EventCategoryApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.eventCategoryManager = null;
    }

    async init() {
        try {
            this.eventCategoryManager = new EventCategoryManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.eventCategoryManager.init();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing event categories:', error);
            this.notificationService.showError('Failed to initialize event categories. Please refresh the page.');
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-category"]')) {
                this.eventCategoryManager.viewCategory(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="edit-category"]')) {
                this.eventCategoryManager.editCategory(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="delete-category"]')) {
                this.eventCategoryManager.toggleStatus(e.target.dataset.categoryId, false, 'Are you sure you want to deactivate category ' + e.target.dataset.title + '?');
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new EventCategoryApp();
    app.init();
});