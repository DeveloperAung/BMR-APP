import {MembershipFormHandler} from './handlers/MembershipFormHandler.js';
import {AuthService} from '../shared/services/AuthService.js';
import {NotificationService} from '../shared/services/NotificationService.js';

export const initMembershipCreate = () => {
    try {
        const form = document.getElementById('categoryForm');
        if (!form) {
            console.error('Category form not found');
            return;
        }

        window.membershipApp = new MembershipFormHandler(form, {
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
if (typeof document !== 'undefined' && !window.__MEMBERSHIP_NO_AUTO_INIT__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMembershipCreate);
    } else {
        initMembershipCreate();
    }
}
