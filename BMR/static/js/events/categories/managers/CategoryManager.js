// static/js/events/categories/managers/CategoryManager.js
import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { EventCategoryRepository } from '../repositories/EventCategoryRepository.js';
import { CategoryTableRenderer } from '../renderers/CategoryTableRenderer.js';
import { CategoryFilterHandler } from '../handlers/CategoryFilterHandler.js';

export class CategoryManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new EventCategoryRepository({ notificationService });
        const tableRenderer = new CategoryTableRenderer();
        const filterHandler = new CategoryFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,
            defaultPerPage: 30,
            defaultFilters: {
                show_all: '',
                ordering: '-created_at'
            }
        });

        this.filterHandler = new CategoryFilterHandler(this.handleFiltersChange.bind(this));
    }

    // Implement required template methods
    async getItems(params) {
        return await this.repository.getCategories(params);
    }

    extractItemsFromResponse(response) {
        return response.categories || response.items || response.results || [];
    }

    getItemType() {
        return 'categories';
    }

    async createCategory(categoryData) {
        try {
            this.notificationService?.showLoading?.('Creating category...');
            const response = await this.repository.submitCategory(categoryData);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async updateCategory(categoryId, categoryData) {
        try {
            this.notificationService?.showLoading?.('Updating category...');
            const response = await this.repository.updateCategory(categoryId, categoryData);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    // Category-specific methods
    async viewCategory(categoryId) {
        console.log(`Viewing category ${categoryId}`);
        window.location.href = `/events/i/categories/${categoryId}/`;
    }

    async editCategory(categoryId) {
        console.log(`Editing category ${categoryId}`);
        window.location.href = `/events/i/categories/${categoryId}/edit/`;
    }

    async toggleCategoryStatus(id, isActive) {
        const result = await this.repository.toggleStatus(id, isActive);
        const action = isActive ? "reactivated" : "deactivated";
        this.notificationService.showSuccess(`Category ${action} successfully!`);
        return result;
    }

    async bulkDeleteCategories(categoryIds) {
        if (!confirm(`Delete ${categoryIds.length} selected categories?`)) return;

        try {
            await this.repository.bulkDeleteCategories(categoryIds);
            this.notificationService.showSuccess(`${categoryIds.length} categories deleted successfully!`);
            await this.loadCategories();
        } catch (error) {
            console.error('Error deleting categories:', error);
            this.notificationService.showError('Failed to delete categories. Please try again.');
        }
    }
}