import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { DONATIONS } from '../../../shared/config/apiConfig.js';

export class DonationCategoryRepository extends BaseRepository {
    constructor(authService) {
        super(DONATIONS.CATEGORIES, authService);
    }

    // Custom method names for your domain
    async getCategories(params = {}) {

        console.log('CategoryManager: Service called get categories');
        const result = await this.getList(params);

        console.log('CategoryManager: Result completed');
        return {
            categories: result.items,
            pagination: result.pagination
        };
    }

    async getCategory(categoryId) {
        return this.getItem(categoryId);
    }

    async createCategory(categoryData) {
        return this.createItem(categoryData);
    }

    async updateCategory(categoryId, categoryData) {
        return this.updateItem(categoryId, categoryData);
    }

    async deleteCategory(categoryId) {
        return this.deleteItem(categoryId);
    }

    // Bulk operations using the inherited method
    async bulkDeleteCategories(categoryIds) {
        return this.bulkOperation('delete', categoryIds);
    }

    async bulkActivateCategories(categoryIds) {
        return this.bulkOperation('activate', categoryIds);
    }

    async bulkDeactivateCategories(categoryIds) {
        return this.bulkOperation('deactivate', categoryIds);
    }
}