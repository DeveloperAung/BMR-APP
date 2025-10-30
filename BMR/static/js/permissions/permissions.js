import { PermissionManager } from './managers/permissionManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class PermissionApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.permissionManager = null;
    }

    async init() {
        try {
            this.permissionManager = new PermissionManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.permissionManager.init();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing event categories:', error);
            this.notificationService.showError('Failed to initialize event categories. Please refresh the page.');
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-permission"]')) {
                this.permissionManager.viewPermission(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="edit-permission"]')) {
                this.permissionManager.editPermission(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="delete-permission"]')) {
                this.permissionManager.toggleStatus(e.target.dataset.categoryId, false, 'Are you sure you want to deactivate category ' + e.target.dataset.title + '?');
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new PermissionApp();
    app.init();
});