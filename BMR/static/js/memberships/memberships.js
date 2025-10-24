import { MembershipManager } from './managers/MembershipManager.js';
import { NotificationService } from '../shared/services/NotificationService.js';
import { AuthService } from '../shared/services/AuthService.js';

class MembershipApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.membershipManager = null;
    }

    async init() {
        try {
            if (!await this.authService.isAuthenticated()) {
                 this.showLoginRequired();
                 return;
             }

            // Initialize users manager
            this.membershipManager = new MembershipManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.membershipManager.init();
        } catch (error) {
            this.notificationService.showError('Failed to initialize membership', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            alert("click event")
            if (e.target.matches('[data-action="view-membership"]')) {
                this.membershipManager.viewMembership(e.target.dataset.membershipId);
            } else if (e.target.matches('[data-action="edit-membership"]')) {
                this.membershipManager.editMembership(e.target.dataset.membershipId);
            } else if (e.target.matches('[data-action="delete-membership"]')) {
                this.membershipManager.toggleStatus(e.target.dataset.membershipId, false, 'Are you sure you want to deactivate category ' + e.target.dataset.title + '?');
            }
        });
    }

    showLoginRequired() {
        document.getElementById('membershipsTableBody').innerHTML = `
            <tr><td colspan="8" class="text-center p-4">
                <div class="alert alert-warning">
                    <h4>Authentication Required</h4>
                    <p>Please log in to access association post management.</p>
                    <a href="/login/" class="btn btn-primary">Go to Login</a>
                </div>
            </td></tr>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new MembershipApp();
    app.init();
});
