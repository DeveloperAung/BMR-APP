import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class EventMediaInfoRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.EVENTS?.MEDIA_INFO|| '/api/events/event-media-info/';
        super(endpoint);
        this.notificationService = notificationService;
    }

    async getMediaInfos(params = {}) {
        console.log("get media", await this.getList(params))
        return this.getList(params);
    }
}
