import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { EventCategoryRepository } from '../repositories/EventCategoryRepository.js';
import { CategoryTableRenderer } from '../renderers/CategoryTableRenderer.js';
import { CategoryFilterHandler } from '../handlers/CategoryFilterHandler.js';

export class EventCategoryManager extends BaseManager {
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

            getItemsFn: (params) => repository.getCategories(params),
            extractItemsFn: (response) => response.categories || response.items || response.results || [],
            itemType: 'categories',

            defaultPerPage: 30,
            defaultFilters: {
                show_all: '',
                ordering: '-created_at'
            }
        });

        this.filterHandler = new CategoryFilterHandler(this.handleFiltersChange.bind(this));
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
}