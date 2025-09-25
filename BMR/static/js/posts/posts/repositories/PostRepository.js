import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class PostRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.POSTS?.POSTS || '/api/posts/';
        super(endpoint);
        this.notificationService = notificationService;
    }

    async submitPost(postData) {
        try {
            return await super.createItem(postData);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async updatePost(postId, postData) {
        try {
            return await super.updateItem(postId, postData);
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
