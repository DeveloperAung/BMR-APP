import { RoleTableRenderer } from './renderers/roleTableRenderer.js';
import { RoleFormHandler } from './handlers/roleFormHandler.js';
import { NotificationService } from '../shared/services/NotificationService.js';

// Initialize role list page
export const initRoleList = () => {
    try {
        const container = document.getElementById('rolesTableContainer');
        if (!container) return;

        new RoleTableRenderer(container, {
            notificationService: new NotificationService()
        });
    } catch (e) {
        console.error('Failed to initialize role list:', e);
        const container = document.getElementById('notifications-container') || document.body;
        container.insertAdjacentHTML('afterbegin', `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error:</strong> Failed to initialize role list. Please check the console.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
    }
};

// Initialize role form page
export const initRoleForm = () => {
    try {
        const form = document.getElementById('roleForm');
        if (!form) return;

        new RoleFormHandler(form, {
            notificationService: new NotificationService()
        });
    } catch (e) {
        console.error('Failed to initialize role form:', e);
        const container = document.getElementById('notifications-container') || document.body;
        container.insertAdjacentHTML('afterbegin', `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error:</strong> Failed to initialize role form. Please check the console.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
    }
};

// Auto-initialize based on the current page
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check if we're on the roles list page
        if (document.getElementById('rolesTableContainer')) {
            initRoleList();
        }
        
        // Check if we're on the role form page
        if (document.getElementById('roleForm')) {
            initRoleForm();
        }
    });
}
