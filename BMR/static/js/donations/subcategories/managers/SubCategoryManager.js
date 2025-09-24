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
        // Setup event listeners for the table actions
        this.setupEventListeners();
        // Load categories for the filter dropdown
        await this.loadCategoriesForFilter();
    }

    setupEventListeners() {
        // Use event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            const subcategoryId = target.getAttribute('data-subcategory-id');
            const title = target.getAttribute('data-title');
            
            switch (action) {
                case 'view-subcategory':
                    this.viewSubCategory(subcategoryId);
                    break;
                case 'edit-subcategory':
                    this.editSubCategory(subcategoryId);
                    break;
                case 'delete-subcategory':
                    this.toggleSubCategoryStatus(subcategoryId, title);
                    break;
            }
        });
    }

    // Implement required template methods
    async getItems(params) {
        return await this.repository.getDonationSubCategories(params);
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
        window.location.href = `/donations/i/subcategories/${subCategoryId}/edit/`;
    }

    async toggleSubCategoryStatus(id, isActive, title) {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) {
            return;
        }

        try {
            const result = await this.repository.toggleStatus(id, false);
            const action = isActive ? "reactivated" : "deleted";
            this.notificationService.showSuccess(`Subcategory ${action} successfully!`);
            await this.loadItems(this.state.currentPage);
            return result;
        } catch (error) {
            this.notificationService.showError(`Failed to update subcategory status: ${error.message}`);
            throw error;
        }
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

    // CRUD Operations
    async createSubCategory(data) {
        try {
            const response = await this.repository.createSubCategory(data);
            this.showNotification('Subcategory created successfully', 'success');
            return response;
        } catch (error) {
            console.error('Create subcategory error:', error);
            throw error;
        }
    }

    async updateSubCategory(subCategoryId, data) {
        try {
            const response = await this.repository.updateSubCategory(subCategoryId, data);
            this.showNotification('Subcategory updated successfully', 'success');
            return response;
        } catch (error) {
            console.error('Update subcategory error:', error);
            throw error;
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