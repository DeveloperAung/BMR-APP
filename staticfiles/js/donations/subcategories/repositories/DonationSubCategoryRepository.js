import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { DONATIONS } from '../../../shared/config/apiConfig.js';

export class DonationSubCategoryRepository extends BaseRepository {
    constructor({ notificationService }) {
        super(DONATIONS.SUB_CATEGORIES);
        this.notificationService = notificationService;
    }

    async getCategories(params = {}) {
        return this.getList(params);
    }

    async getSubCategory(subCategoryId) {
        return this.getItem(subCategoryId);
    }

    async submitSubCategory(subCategoryData) {
        alert('DonationSubCategoryRepository: Service called submit category');
        if (!subCategoryData.title || subCategoryData.title.trim() === '') {
            throw new Error('Title is required');
        }
        if (!subCategoryData.title_others || subCategoryData.title_others.trim() === '') {
            throw new Error('Title  (Eng) is required');
        }
        if (!subCategoryData.donation_category || subCategoryData.donation_category === '') {
            throw new Error('Category title is required');
        }

        try {
            alert('DonationSubCategoryRepository: Service called submit category');
            return await super.createItem(subCategoryData);
        } catch (error) {
            console.log('DonationSubCategoryRepository: Service called create item');
            throw error;
        }
    }

    async updateSubCategory(subCategoryId, subCategoryData) {
        return this.updateItem(subCategoryId, subCategoryData);
    }

    async deleteSubCategory(subCategoryId) {
        return this.toggleStatus(subCategoryId, false);
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