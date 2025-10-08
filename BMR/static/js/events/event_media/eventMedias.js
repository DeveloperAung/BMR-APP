import { EventMediaManager } from './managers/MediaManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class EventMediaApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.eventMediaManager = null;
    }

    async init() {
        try {
            this.eventMediaManager = new EventMediaManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.eventMediaManager.init();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing event categories:', error);
            this.notificationService.showError('Failed to initialize event categories. Please refresh the page.');
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-media"]')) {
                this.eventMediaManager.viewMedia(e.target.dataset.mediaId);
            } else if (e.target.matches('[data-action="edit-media"]')) {
                this.eventMediaManager.editMedia(e.target.dataset.mediaId);
            } else if (e.target.matches('[data-action="delete-media"]')) {
                this.eventMediaManager.toggleStatus(e.target.dataset.mediaId, false, 'Are you sure you want to deactivate category ' + e.target.dataset.title + '?');
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new EventMediaApp();
    app.init();
});