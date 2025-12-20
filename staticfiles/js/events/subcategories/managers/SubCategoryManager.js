import { EventSubCategoryRepository } from '../repositories/EventSubCategoryRepository.js';
import { SubCategoryTableRenderer } from '../renderers/SubCategoryTableRenderer.js';
import { SubCategoryFilterHandler } from '../handlers/SubCategoryFilterHandler.js';
import { BaseManager } from '../../../shared/managers/BaseManager.js';

export class EventSubCategoryManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new EventSubCategoryRepository({ notificationService });
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
            itemType: 'subCategories',

            defaultPerPage: 30,
            defaultFilters: {
                show_all: '',
                ordering: '-created_at'
            }
        });
        this.filterHandler = new SubCategoryFilterHandler(this.handleFiltersChange.bind(this));
    }

    async createSubCategory(categoryData) {
        try {
            this.notificationService?.showLoading?.('Creating sub category...');
            const response = await this.repository.submitEventSubCategory(categoryData);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async updateSubCategory(categoryId, categoryData) {
        try {
            this.notificationService?.showLoading?.('Updating sub category...');
            const response = await this.repository.updateCategory(categoryId, categoryData);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    // Category-specific methods
    async viewCategory(Id) {
        console.log(`Viewing category ${Id}`);
        window.location.href = `/events/i/subcategories/${Id}/`;
    }

    async editCategory(Id) {
        console.log(`Editing category ${Id}`);
        window.location.href = `/events/i/subcategories/${Id}/edit/`;
    }
}