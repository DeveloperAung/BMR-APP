import { CategoryManager } from './managers/CategoryManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

document.addEventListener('DOMContentLoaded', () => {
    const authService = new AuthService();
    const notificationService = new NotificationService();
    const categoryManager = new CategoryManager({ authService, notificationService });
    categoryManager.init();
});
