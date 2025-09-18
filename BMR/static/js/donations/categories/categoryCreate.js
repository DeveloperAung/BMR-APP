// static/js/donations/categories/categoryCreate.js
import { CategoryFormHandler } from './handlers/CategoryFormHandler.js';
import { DonationCategoryRepository } from './repositories/DonationCategoryRepository.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class CategoryCreateApp {
    constructor() {
        this.notificationService = new NotificationService();
        this.categoryRepository = new DonationCategoryRepository();
        this.formHandler = null;
    }

    async init() {
        try {
            // Check if user has access token (simple auth check)
            const accessToken = localStorage.getItem('access_token');
            if (!accessToken) {
                this.redirectToLogin();
                return;
            }

            // Get mode and category ID from URL or data attributes
            const mode = this.getMode();
            const categoryId = this.getCategoryId();

            console.log(`Initializing category ${mode} form`, { mode, categoryId });

            // Initialize form handler
            this.formHandler = new CategoryFormHandler({
                repository: this.categoryRepository,
                notificationService: this.notificationService,
                mode: mode,
                categoryId: categoryId
            });

            await this.formHandler.init();

            console.log(`Category ${mode} form initialized successfully`);

        } catch (error) {
            console.error('Failed to initialize category form:', error);
            this.notificationService.showError('Failed to initialize form. Please refresh the page.');
        }
    }

    getMode() {
        // Try to get mode from URL, data attribute, or default to 'create'
        const path = window.location.pathname;

        if (path.includes('/edit/') || path.includes('/update/')) {
            return 'edit';
        }

        // Check for data attribute on body or main container
        const modeElement = document.querySelector('[data-mode]');
        if (modeElement) {
            return modeElement.dataset.mode;
        }

        return 'create';
    }

    getCategoryId() {
        // Try to get category ID from URL or data attribute
        const path = window.location.pathname;
        const match = path.match(/\/(\d+)\//);

        if (match) {
            return match[1];
        }

        // Check for data attribute
        const idElement = document.querySelector('[data-category-id]');
        if (idElement) {
            return idElement.dataset.categoryId;
        }

        return null;
    }

    redirectToLogin() {
        console.warn('No access token found, redirecting to login');
        window.location.href = '/login/';
    }

    // Public methods for external use
    getFormHandler() {
        return this.formHandler;
    }

    async validateAndSubmit() {
        if (this.formHandler) {
            return await this.formHandler.handleSubmit(new Event('submit'));
        }
    }

    resetForm() {
        if (this.formHandler) {
            this.formHandler.reset();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.categoryCreateApp = new CategoryCreateApp();
    window.categoryCreateApp.init();
});

// Export for module usage
export default CategoryCreateApp;