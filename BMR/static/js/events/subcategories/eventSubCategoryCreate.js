import {SubCategoryFormHandler} from './handlers/SubCategoryFormHandler.js';
import {AuthService} from '../../shared/services/AuthService.js';
import {NotificationService} from '../../shared/services/NotificationService.js';

export const initEventSubCategoryCreate = () => {
    try {
        const form = document.getElementById('eventSubCategoryForm');
        if (!form) {
            console.error('Event Sub Category form not found');
            return;
        }
        console.log('Initializing Event Sub Category form...');

        window.eventCategoryApp = new SubCategoryFormHandler(form, {
            authService: new AuthService(),
            notificationService: new NotificationService()
        });

        console.log('Event Sub Category form initialized successfully');

    } catch (e) {
        console.error('Init failed:', e);
        const container = document.getElementById('notifications-container') || document.body;
        container.insertAdjacentHTML('afterbegin', `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error:</strong> Failed to initialize form. Please check the console.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
    }
};

// Auto-init
if (typeof document !== 'undefined' && !window.__EVENT__SUBCATEGORY_NO_AUTO_INIT__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventSubCategoryCreate);
    } else {
        initEventSubCategoryCreate();
    }
}