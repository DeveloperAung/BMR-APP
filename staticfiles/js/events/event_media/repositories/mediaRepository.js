import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class EventMediaRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.EVENTS?.MEDIAS|| '/api/events/event-medias/';
        super(endpoint);
        this.notificationService = notificationService;
    }

    async submitMedia(data) {
        try {
            return await super.createItem(data);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async updateMedia(id, data) {

        try {
            return await super.updateItem(id, data);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getMedias(params = {}) {
        return this.getList(params);
    }

    async getMedia(postId) {
        return this.getItem(postId);
    }
}
