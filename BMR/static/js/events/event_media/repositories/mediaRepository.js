import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class EventMediaRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.EVENTS?.MEDIAS || '/api/events/event-media/upload/';
        super(endpoint);
        this.notificationService = notificationService;
    }

    async submitPost(data) {
        try {
            return await super.createItem(data);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async updatePost(id, data) {

        try {
            console.log("Post data ", data)
            return await super.updateItem(id, data);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getPosts(params = {}) {
        return this.getList(params);
    }

    async getPost(postId) {
        return this.getItem(postId);
    }
}
