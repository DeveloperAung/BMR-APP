import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class EventMediaUploadRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.EVENTS?.MEDIAS_UPLOAD || '/api/events/event-media/';
        super(endpoint);
        this.notificationService = notificationService;
    }

    async submitMedia(data) {
        try {
            return await super.createItem(data);
        } catch (error) {
            console.error('Error uploading event media:', error);
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }
}
