import { EventManager } from './managers/EventManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class EventApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.eventManager = null;
    }

    async init() {
        try {
             if (!await this.authService.isAuthenticated()) {
                 this.showLoginRequired();
                 return;
             }

            this.eventManager = new EventManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.eventManager.init();
            this.setupEventListeners();
        } catch (error) {
            this.notificationService.showError('Failed to initialize event management', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-event"]')) {
                this.eventManager.viewEvent(e.target.dataset.eventId);
            } else if (e.target.matches('[data-action="edit-event"]')) {
                this.eventManager.editEvent(e.target.dataset.eventId);
            } else if (e.target.matches('[data-action="media-event"]')) {
                this.eventManager.mediaEvent(e.target.dataset.eventId);
            } else if (e.target.matches('[data-action="delete-event"]')) {
                this.eventManager.toggleStatus(e.target.dataset.eventId, false, 'Are you sure you want to deactivate event "' + e.target.dataset.title + '" ?');
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
    const app = new EventApp();
    app.init();
});
