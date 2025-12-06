import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class SubCateDropDownRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.EVENTS?.BASE || '/api/events/';
        super(endpoint);
        this.notificationService = notificationService;
    }

    async getSubCategoriesByEvent(eventId, params = {}) {
        if (!eventId) throw new Error("eventId is required to fetch subcategories.");

        const endpoint = API_ENDPOINTS?.EVENTS?.BASE || '/api/events/';
        const url = `${endpoint}${eventId}/subcategories/`;
        try {
            const jsonData = await this.apiService.get(url, params);
            console.log("data", jsonData)
            return this.extractListData(jsonData);
        } catch (error) {
            console.error(`${this.constructor.name}.getList failed:`, error);
            throw error;
        }
    }
}