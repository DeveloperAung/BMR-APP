import { EventMediaInfoManager } from './managers/MediaInfoManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class EventMediaInfoApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.eventMediaInfoManager = null;
    }

    async init() {
        try {
            this.eventMediaInfoManager = new EventMediaInfoManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.eventMediaInfoManager.init();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing event categories:', error);
            this.notificationService.showError('Failed to initialize event categories. Please refresh the page.');
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-media"]')) {
                this.eventMediaInfoManager.viewMediaInfo(e.target.dataset.mediaId);
            } else if (e.target.matches('[data-action="edit-media"]')) {
                this.eventMediaInfoManager.editMediaInfo(e.target.dataset.mediaId);
            } else if (e.target.matches('[data-action="delete-media"]')) {
                this.eventMediaInfoManager.toggleStatus(e.target.dataset.mediaId, false, 'Are you sure you want to deactivate category ' + e.target.dataset.title + '?');
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new EventMediaInfoApp();
    app.init();
});