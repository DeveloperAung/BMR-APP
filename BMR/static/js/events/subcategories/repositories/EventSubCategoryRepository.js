import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import {API_ENDPOINTS, EVENTS} from '../../../shared/config/apiConfig.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';

export class EventSubCategoryRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.EVENTS?.SUB_CATEGORIES || '/api/events/subcategories/';
        super(endpoint); // must be called first
        this.notificationService = notificationService;
    }

    async submitEventSubCategory(subCategoryData) {
        if (!subCategoryData.title || subCategoryData.title.trim() === '') {
            throw new Error('Title is required');
        }
        if (!subCategoryData.title_others || subCategoryData.title_others.trim() === '') {
            throw new Error('Title  (Eng) is required');
        }
        if (!subCategoryData.event_category || subCategoryData.event_category === '') {
            throw new Error('Category title is required');
        }

        const payload = {
            title: subCategoryData.title.trim(),
            title_others: subCategoryData.title_others.trim(),
            event_category: subCategoryData.event_category,
            is_menu: true,
            is_active: true
        };

        try {
            return await super.createItem(payload);
        } catch (error) {
            console.log('DonationSubCategoryRepository: Service called create item');
            throw error;
        }
    }

    async updateCategory(categoryId, categoryData) {
        if (!categoryId) throw new Error('Category ID is required for update');
        if (!categoryData.title_others || categoryData.title_others.trim() === '') {
            throw new Error('Category title (others) is required');
        }

        const payload = {};
        if (categoryData.title !== undefined) payload.title = categoryData.title.trim();
        if (categoryData.title_others !== undefined) payload.title_others = categoryData.title_others.trim();
        if ('is_active' in categoryData) {
            payload.is_active = Boolean(categoryData.is_active);
        }
        if ('is_menu' in categoryData) {
            payload.is_menu = Boolean(categoryData.is_menu);
        }

        try {
            const result = await super.updateItem(categoryId, payload);
            console.log('Event category updated successfully', result);
            return result;
        } catch (error) {
            console.error('Update event category failed', error);
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getCategories(params = {}) {
        return this.getList(params);
    }

    async getCategory(categoryId) {
        return this.getItem(categoryId);
    }

}