import { EventMediaHandler } from './handlers/MediaHandler.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

export async function initEventSubCategoryHandler() {
    const authService = new AuthService();
    const notificationService = new NotificationService();

    const handler = new EventMediaHandler({ authService, notificationService });
    await handler.init();
}