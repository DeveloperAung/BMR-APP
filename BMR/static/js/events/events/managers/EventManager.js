import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { EventRepository } from '../repositories/EventRepository.js';
import { EventTableRenderer } from '../renderers/EventTableRenderer.js';
import { EventFilterHandler } from "../handlers/EventFilterHandler.js";

export class EventManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new EventRepository({ notificationService });
        const tableRenderer = new EventTableRenderer();
        const filterHandler = new EventFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,

             getItemsFn: async (params) => {
                const res = await repository.getEvents(params);
                return res;
              },
            extractItemsFn: (response) => response.data || response.results || response.items || [],

            itemType: 'events',

            defaultPerPage: 30,
            defaultFilters: {
                ordering: '-published_at'
            }
        });
    }

    async createEvent(data) {
        this.notificationService?.showLoading?.('Creating Event...');
        const response = await this.repository.submitEvent(data);
        this.notificationService?.hideLoading?.();
        return response;
    }

    async updateEvent(id, data) {
        this.notificationService?.showLoading?.('Updating Event...');
        const response = await this.repository.updateEvent(id, data);
        this.notificationService?.hideLoading?.();
        return response;
    }

    async viewEvent(Id) {
        console.log(`Viewing category ${Id}`);
        window.location.href = `/events/i/media/create/`;
    }

    async mediaEvent(id) {
        if (!id) return;
        window.location.href = `/events/i/media/create/?event_id=${id}`;
    }

    async editEvent(Id) {
        console.log(`Editing category ${Id}`);
        window.location.href = `/events/i/${Id}/edit/`;
    }
}
