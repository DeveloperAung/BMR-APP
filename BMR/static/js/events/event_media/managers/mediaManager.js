import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { EventMediaRepository } from '../repositories/mediaRepository.js';
import { MediaTableRenderer } from '../renderers/MediaTableRenderer.js';
import { MediaFilterHandler } from '../handlers/MediaFilterHandler.js';

export class EventMediaManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new EventMediaRepository({ notificationService });
        const tableRenderer = new MediaTableRenderer();
        const filterHandler = new MediaFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,

            // getItemsFn: (params) => repository.getMedias(params),
            getItemsFn: async (params) => {
                const result = await repository.getMedias(params);
                console.log('getMedias result:', result); // Log the result
                return result;
            },
            extractItemsFn: (response) => response.media || response.items || response.results || [],
            itemType: 'medias',

            defaultPerPage: 30,
            defaultFilters: {
                show_all: '',
                ordering: '-created_at'
            }
        });

        this.filterHandler = new MediaFilterHandler(this.handleFiltersChange.bind(this));
    }

    async loadEventMedia({ eventId, subCategoryId = null }) {
        try {
            const filters = {};
            if (eventId) filters.event_id = eventId;
            if (subCategoryId) filters.subcategory_id = subCategoryId;

            console.log('Fetching Event Media with filters:', filters);
            const response = await this.repository.getMedias(filters);

            // The API returns an array or paginated object
            const items =
                Array.isArray(response)
                    ? response
                    : response.items || response.results || [];

            console.log('Loaded Event Media items:', items);
            return items;
        } catch (error) {
            console.error('Error loading event media:', error);
            throw error;
        }
    }

    async createMedia(data) {
        try {
            this.notificationService?.showLoading?.('Creating media...');
            const response = await this.repository.submitCategory(data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async updateMedia(id, data) {
        try {
            this.notificationService?.showLoading?.('Updating media...');
            const response = await this.repository.updateCategory(id, data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    // Category-specific methods
    async viewMedia(id) {
        console.log(`Viewing media ${id}`);
        window.location.href = `/events/i/medias/${id}/`;
    }

    async editMedia(id) {
        console.log(`Editing media ${id}`);
        window.location.href = `/events/i/medias/${id}/edit/`;
    }
}