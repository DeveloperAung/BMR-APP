import { CategoryFormHandler } from './handlers/CategoryFormHandler.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class EventCategoryCreateApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.formHandler = null;
    }

    async init() {
        try {
            const form = document.getElementById('eventCategoryForm');
            if (!form) {
                throw new Error('Category form not found');
            }

            this.formHandler = new CategoryFormHandler(form, {
                authService: this.authService,
                notificationService: this.notificationService
            });

            // Set up any additional event listeners here
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing event category form:', error);
            this.notificationService.showError('Failed to initialize the form. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Add any additional event listeners here
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.href = '/events/i/categories/';
                }
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new EventCategoryCreateApp();
    app.init();
});
