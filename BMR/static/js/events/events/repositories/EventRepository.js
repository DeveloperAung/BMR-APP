import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class EventRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.EVENTS?.EVENTS || '/api/events/events/';
        super(endpoint);
        this.notificationService = notificationService;
    }

    async submitEvent(data) {
        try {
            return await super.createItem(data);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async updateEvent(id, data) {

        try {
            console.log("Event data ", data)
            return await super.updateItem(id, data);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getEvents(params = {}) {
        return this.getList(params);
    }

    async getEvent(id) {
        return this.getItem(id);
    }
}
