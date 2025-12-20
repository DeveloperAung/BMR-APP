import { AssociationFormHandler } from './handlers/AssociationFormHandler.js';
import { AuthService } from '../shared/services/AuthService.js';
import { NotificationService } from '../shared/services/NotificationService.js';

export const initPostCreate = () => {
    try {
        const form = document.getElementById('assoPostForm');
        if (!form) {
            console.error('Post form not found');
            return;
        }

        // Make sure Quill is initialised on the page before creating the handler
        // (if you haven’t done it in your base template):
        // if (!window.quillEditor) {
        //     window.quillEditor = new Quill('#editor7', {
        //         modules: { toolbar: '#toolbar7' },
        //         theme: 'snow'
        //     });
        // }

        window.postApp = new AssociationFormHandler(form, {
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

// Auto-init for both create and edit
if (typeof document !== 'undefined' && !window.__POST_NO_AUTO_INIT__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPostCreate);
    } else {
        initPostCreate();
    }
}
