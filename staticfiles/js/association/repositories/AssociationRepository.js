import { BaseRepository } from '../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../shared/config/apiConfig.js';

export class AssociationRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.ASSOCIATION?.POSTS || '/api/associations/posts/';
        super(endpoint); // must be called first
        this.notificationService = notificationService;

        console.log('Initializing DonationCategoryRepository with endpoint:', endpoint);
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
            console.log("Post data ", postData)
            return await super.updateItem(postId, postData);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getAssoPosts(params = {}) {
        return this.getList(params);
    }
}