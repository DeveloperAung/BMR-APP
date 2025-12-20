import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class DonationCategoryRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.DONATIONS?.CATEGORIES || '/api/donations/categories/';
        super(endpoint); // must be called first
        this.notificationService = notificationService;

        console.log('Initializing DonationCategoryRepository with endpoint:', endpoint);
    }

    async submitCategory(categoryData) {
        if (!categoryData.title || categoryData.title.trim() === '') {
            throw new Error('Category title is required');
        }

        const payload = {
            title: categoryData.title.trim(),
            title_others: categoryData.title_others.trim(),
            is_date_required: Boolean(categoryData.is_date_required),
            is_multi_select_required: Boolean(categoryData.is_multi_select_required)
        };
        if ('is_active' in categoryData) {
            payload.is_active = Boolean(categoryData.is_active);
        }

        try {
            return await super.createItem(payload);
        } catch (error) {
            throw error;
        }
    }

    async updateCategory(categoryId, categoryData) {
        if (!categoryId) throw new Error('Category ID is required for update');

        const payload = {};
        if (categoryData.title !== undefined) payload.title = categoryData.title.trim();
        if (categoryData.title_others !== undefined) payload.title_others = categoryData.title_others.trim();
        if (categoryData.is_date_required !== undefined) payload.is_date_required = Boolean(categoryData.is_date_required);
        if (categoryData.is_multi_select_required !== undefined) payload.is_multi_select_required = Boolean(categoryData.is_multi_select_required);
        if ('is_active' in categoryData) {
            payload.is_active = Boolean(categoryData.is_active);
        }

        try {
            const result = await super.updateItem(categoryId, payload);
            console.log('Category updated successfully', result);
            return result;
        } catch (error) {
            console.error('Update category failed', error);
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