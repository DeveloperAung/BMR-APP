import { BaseManager } from '../../shared/managers/BaseManager.js';
import { AssociationRepository } from '../repositories/AssociationRepository.js';
import { AssociationTableRenderer } from '../renderers/AssociationTableRenderer.js';
import { FilterHandler } from '../handlers/FilterHandler.js';

export class AssociationManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new AssociationRepository({ notificationService });
        const tableRenderer = new AssociationTableRenderer();
        const filterHandler = new FilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,

            getItemsFn: (params) => repository.getAssoPosts(params),
            extractItemsFn: (response) => response.posts || response.items || response.results || [],
            itemType: 'posts',

            defaultPerPage: 30,
            defaultFilters: {
                show_all: '',
                ordering: '-created_at'
            }
        });

        this.filterHandler = new FilterHandler(this.handleFiltersChange.bind(this));
    }

    async createAssoPost(data) {
        try {
            this.notificationService?.showLoading?.('Creating category...');
            const response = await this.repository.submitCategory(data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async updateAssoPost(id, data) {
        try {
            this.notificationService?.showLoading?.('Updating post...');
            const response = await this.repository.updateCategory(id, data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    // Category-specific methods
    async viewAssoPost(id) {
        console.log(`Viewing category ${id}`);
        window.location.href = `/associations/i/posts/${id}/`;
    }

    async editAssoPost(id) {
        console.log(`Editing category ${id}`);
        window.location.href = `/associations/i/posts/${id}/edit/`;
    }

}