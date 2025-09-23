import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { DONATIONS } from '../../../shared/config/apiConfig.js';

export class DonationSubCategoryRepository extends BaseRepository {
    constructor() {
        super(DONATIONS.SUB_CATEGORIES);
    }

    // Custom method names for your domain
    async getSubCategories(params = {}) {
//        console.log('SubCategoryRepository: Service called get subcategories');
        const result = await this.getList(params);
//        console.log('SubCategoryRepository: Result completed');

        return {
            subCategories: result.items,
            pagination: result.pagination
        };
    }

    async getSubCategory(subCategoryId) {
        return this.getItem(subCategoryId);
    }

    async createSubCategory(subCategoryData) {
        return this.createItem(subCategoryData);
    }

    async updateSubCategory(subCategoryId, subCategoryData) {
        return this.updateItem(subCategoryId, subCategoryData);
    }

    async deleteSubCategory(subCategoryId) {
        return this.deleteItem(subCategoryId);
    }

    // Bulk operations using the inherited method
    async bulkDeleteSubCategories(subCategoryIds) {
        return this.bulkOperation('delete', subCategoryIds);
    }

    async bulkActivateSubCategories(subCategoryIds) {
        return this.bulkOperation('activate', subCategoryIds);
    }

    async bulkDeactivateSubCategories(subCategoryIds) {
        return this.bulkOperation('deactivate', subCategoryIds);
    }

}