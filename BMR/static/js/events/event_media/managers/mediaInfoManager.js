import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { EventMediaInfoRepository } from '../repositories/mediaInfoRepository.js';
import { MediaInfoTableRenderer } from '../renderers/MediaInfoTableRenderer.js';
import { MediaFilterHandler } from '../handlers/MediaFilterHandler.js';
import { MediaInfoFilterHandler } from "../handlers/MediaInfoFilterHandler.js";

export class EventMediaInfoManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new EventMediaInfoRepository({ notificationService });
        const tableRenderer = new MediaInfoTableRenderer();
        const filterHandler = new MediaInfoFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,

            // getItemsFn: (params) => repository.getMedias(params),
            getItemsFn: async (params) => {
                const result = await repository.getMediaInfos(params);
                console.log('getMedias result:', result);
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

    async viewMediaInfo(id) {
        console.log(`Viewing media ${id}`);
        window.location.href = `/events/i/medias/${id}/`;
    }

    async editMediaInfo(id) {
        console.log(`Editing media ${id}`);
        window.location.href = `/events/i/medias/${id}/edit/`;
    }
}