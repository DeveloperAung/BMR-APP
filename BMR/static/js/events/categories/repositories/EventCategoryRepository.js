import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class EventCategoryRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.EVENTS?.CATEGORIES || '/api/events/categories/';
        super(endpoint); // must be called first
        this.notificationService = notificationService;
        console.log('Initializing EventCategoryRepository with endpoint:', endpoint);
    }

    async submitCategory(categoryData) {
        if (!categoryData.title || categoryData.title.trim() === '') {
            throw new Error('Category title is required');
        }
        if (!categoryData.title_others || categoryData.title_others.trim() === '') {
            throw new Error('Category title (others) is required');
        }

        const payload = {
            title: categoryData.title.trim(),
            title_others: categoryData.title_others.trim(),
            is_menu: true,
            is_active: true
        };

        try {
            return await super.createItem(payload);
        } catch (error) {
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
        if (categoryData.title !== undefined) payload.title_others = categoryData.title_others.trim();
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
    
    async toggleStatus(id, isActive) {
        return this.updateCategory(id, { is_active: isActive });
    }
    
    async bulkDeleteCategories(categoryIds) {
        return this.bulkOperation('delete', categoryIds);
    }
}