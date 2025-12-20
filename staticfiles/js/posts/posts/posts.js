import { PostManager } from './managers/PostManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class PostApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.postManager = null;
    }

    async init() {
        try {
             if (!await this.authService.isAuthenticated()) {
                 this.showLoginRequired();
                 return;
             }

            this.postManager = new PostManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.postManager.init();
            this.setupEventListeners();
        } catch (error) {
            this.notificationService.showError('Failed to initialize post management', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-post"]')) {
                this.postManager.viewPost(e.target.dataset.postId);
            } else if (e.target.matches('[data-action="edit-post"]')) {
                this.postManager.editPost(e.target.dataset.postId);
            } else if (e.target.matches('[data-action="delete-post"]')) {
                this.postManager.toggleStatus(e.target.dataset.postId, false, 'Are you sure you want to deactivate post "' + e.target.dataset.title + '" ?');
            }
        });
    }

    showLoginRequired() {
        document.getElementById('postsTableBody').innerHTML = `
            <tr><td colspan="5" class="text-center p-4">
                <div class="alert alert-warning">
                    <h4>Authentication Required</h4>
                    <p>Please log in to access category management.</p>
                    <a href="/login/" class="btn btn-primary">Go to Login</a>
                </div>
            </td></tr>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new PostApp();
    app.init();
});