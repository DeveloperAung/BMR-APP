import { AssociationManager } from './managers/AssociationManager.js';
import { NotificationService } from '../shared/services/NotificationService.js';
import { AuthService } from '../shared/services/AuthService.js';

class AssociationApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.assoicationManager = null;
    }

    async init() {
         try {
             if (!await this.authService.isAuthenticated()) {
                 this.showLoginRequired();
                 return;
             }

            this.assoicationManager = new AssociationManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.assoicationManager.init();
            this.setupEventListeners();
        } catch (error) {
            this.notificationService.showError('Failed to initialize association post management', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-asso-post"]')) {
                this.assoicationManager.viewAssoPost(e.target.dataset.postId);
            } else if (e.target.matches('[data-action="edit-asso-post"]')) {
                this.assoicationManager.editAssoPost(e.target.dataset.postId);
            } else if (e.target.matches('[data-action="delete-asso-post"]')) {
                this.assoicationManager.toggleStatus(e.target.dataset.postId, false, 'Are you sure you want to deactivate category ' + e.target.dataset.title + '?');
            }
        });
    }

    showLoginRequired() {
        document.getElementById('postsTableBody').innerHTML = `
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

document.addEventListener('DOMContentLoaded', () => {
    const app = new AssociationApp();
    app.init();
});