// static/js/donations/subcategories/managers/SubCategoryManager.js
import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { DonationSubCategoryRepository } from '../repositories/DonationSubCategoryRepository.js';
import { SubCategoryTableRenderer } from '../renderers/SubCategoryTableRenderer.js';
import { SubCategoryFilterHandler } from '../handlers/SubCategoryFilterHandler.js';

export class SubCategoryManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new DonationSubCategoryRepository({ notificationService });
        const tableRenderer = new SubCategoryTableRenderer();
        const filterHandler = new SubCategoryFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,

            getItemsFn: (params) => repository.getCategories(params),
            extractItemsFn: (response) => response.categories || response.items || response.results || [],
            itemType: 'subcategories',

            defaultPerPage: 30,
            defaultFilters: {
                event_category: '',
                ordering: '-created_at'
            }
        });

        // Initialize filter handler with callback
        this.filterHandler = new SubCategoryFilterHandler(this.handleFiltersChange.bind(this));
    }

    // SubCategory-specific methods
    async viewSubCategory(subCategoryId) {
        console.log(`Viewing subcategory ${subCategoryId}`);
        // Implement specific view logic
    }

    async editSubCategory(subCategoryId) {
        window.location.href = `/donations/i/subcategories/${subCategoryId}/edit/`;
    }

    // Load categories for filter dropdown
    async loadCategoriesForFilter() {
        try {
            const categories = await this.repository.getEventCategories();
            this.populateCategoryFilter(categories);
        } catch (error) {
            console.error('Failed to load categories for filter:', error);
        }
    }

    populateCategoryFilter(categories) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && categories) {
            // Clear existing options except the first one (All Categories)
            const firstOption = categoryFilter.querySelector('option[value=""]');
            categoryFilter.innerHTML = '';
            if (firstOption) {
                categoryFilter.appendChild(firstOption);
            }

            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.title;
                categoryFilter.appendChild(option);
            });
        }
    }

    async createSubCategory(categoryData) {
        try {
            this.notificationService?.showLoading?.('Creating category...');
            const response = await this.repository.submitSubCategory(categoryData);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async updateSubCategory(Id, data) {
        try {
            this.notificationService?.showLoading?.('Updating category...');
            const response = await this.repository.updateSubCategory(Id, data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async bulkDeleteSubCategories(subCategoryIds) {
        if (!confirm(`Delete ${subCategoryIds.length} selected subcategories?`)) return;

        try {
            await this.repository.bulkDeleteSubCategories(subCategoryIds);
            this.notificationService.success(`${subCategoryIds.length} subcategories deleted successfully`);
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Bulk delete error:', error);
            this.notificationService.error('Failed to delete selected subcategories');
        }
    }

    // Filter by specific category
    filterByCategory(categoryId) {
        this.updateFilters({ event_category: categoryId });
    }
}