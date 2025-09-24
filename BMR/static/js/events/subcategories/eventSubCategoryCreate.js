import { SubCategoryFormHandler } from './handlers/SubCategoryFormHandler.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class EventSubCategoryCreateApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.formHandler = null;
    }

    async init() {
        try {
            const form = document.getElementById('eventSubCategoryForm');
            if (!form) {
                throw new Error('Subcategory form not found');
            }

            this.formHandler = new SubCategoryFormHandler(form, {
                authService: this.authService,
                notificationService: this.notificationService
            });

            // Set up any additional event listeners here
            this.setupEventListeners();

            // If in edit mode, load the subcategory data
            const urlParams = new URLSearchParams(window.location.search);
            const mode = urlParams.get('mode');
            const subcategoryId = urlParams.get('id');

            if (mode === 'edit' && subcategoryId) {
                await this.formHandler.loadSubCategory(subcategoryId);
            }
        } catch (error) {
            console.error('Error initializing event subcategory form:', error);
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
                    window.location.href = '/events/i/subcategories/';
                }
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new EventSubCategoryCreateApp();
    app.init();
});
