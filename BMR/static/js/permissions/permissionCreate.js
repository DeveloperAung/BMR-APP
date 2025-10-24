import {CategoryFormHandler} from './handlers/permissionFormHandler.js';
import {AuthService} from '../../shared/services/AuthService.js';
import {NotificationService} from '../../shared/services/NotificationService.js';

export const initEventCategoryCreate = () => {
    try {
        const form = document.getElementById('eventCategoryForm');
        if (!form) {
            console.error('Event Category form not found');
            return;
        }

        window.eventCategoryApp = new CategoryFormHandler(form, {
            authService: new AuthService(),
            notificationService: new NotificationService()
        });

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
if (typeof document !== 'undefined' && !window.__EVENT_CATEGORY_NO_AUTO_INIT__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventCategoryCreate);
    } else {
        initEventCategoryCreate();
    }
}
