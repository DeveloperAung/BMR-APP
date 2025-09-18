// static/js/donations/subcategories/managers/SubCategoryManager.js
import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { DonationSubCategoryRepository } from '../repositories/DonationSubCategoryRepository.js';
import { SubCategoryTableRenderer } from '../renderers/SubCategoryTableRenderer.js';
import { SubCategoryFilterHandler } from '../handlers/SubCategoryFilterHandler.js';

export class SubCategoryManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new DonationSubCategoryRepository(authService);
        const tableRenderer = new SubCategoryTableRenderer();
        const filterHandler = new SubCategoryFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,
            defaultPerPage: 30,
            defaultFilters: {
                event_category: '',
                ordering: '-created_at'
            }
        });

        // Initialize filter handler with callback
        this.filterHandler = new SubCategoryFilterHandler(this.handleFiltersChange.bind(this));
    }

    async init() {
        await super.init();
        // Load categories for the filter dropdown
        await this.loadCategoriesForFilter();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-subcategory"]')) {
                this.viewSubCategory(e.target.dataset.subcategoryId);
            } else if (e.target.matches('[data-action="edit-subcategory"]')) {
                this.editSubCategory(e.target.dataset.subcategoryId);
            } else if (e.target.matches('[data-action="delete-subcategory"]')) {
                this.deleteSubCategory(e.target.dataset.subcategoryId, e.target.dataset.title);
            }
        });
    }

    // Implement required template methods
    async getItems(params) {
        return await this.repository.getSubCategories(params);
    }

    extractItemsFromResponse(response) {
        return response.subCategories || response.items || response.results || [];
    }

    getItemType() {
        return 'subcategories';
    }

    // SubCategory-specific methods
    async viewSubCategory(subCategoryId) {
        console.log(`Viewing subcategory ${subCategoryId}`);
        // Implement specific view logic
    }

    async editSubCategory(subCategoryId) {
        console.log(`Editing subcategory ${subCategoryId}`);
        // Implement specific edit logic
    }

    async deleteSubCategory(subCategoryId, title) {
        await this.deleteItem(subCategoryId, title, `Delete subcategory "${title}"?`);
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

    // Additional subcategory-specific methods
    async toggleSubCategoryStatus(subCategoryId, currentStatus) {
        try {
            const newStatus = !currentStatus;
            await this.repository.updateSubCategory(subCategoryId, { is_active: newStatus });
            this.showNotification(`Subcategory status updated successfully`, 'success');
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Toggle status error:', error);
            this.showNotification('Failed to update subcategory status', 'error');
        }
    }

    async bulkDeleteSubCategories(subCategoryIds) {
        if (!confirm(`Delete ${subCategoryIds.length} selected subcategories?`)) return;

        try {
            await this.repository.bulkDeleteSubCategories(subCategoryIds);
            this.showNotification(`${subCategoryIds.length} subcategories deleted successfully`, 'success');
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Bulk delete error:', error);
            this.showNotification('Failed to delete selected subcategories', 'error');
        }
    }

    // Filter by specific category
    filterByCategory(categoryId) {
        this.updateFilters({ event_category: categoryId });
    }
}