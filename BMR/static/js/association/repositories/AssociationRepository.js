import { BaseRepository } from '../../shared/repositories/BaseRepository.js';
import { ASSOCIATION } from '../../shared/config/apiConfig.js';

export class AssociationRepository extends BaseRepository {
    constructor() {
        super(ASSOCIATION.POSTS);
    }

    async getAssoPosts(params = {}) {

        console.log('AssoManager: Service called get categories');
        const result = await this.getList(params);

        console.log('AssoManager: Result completed');
        return {
            assoPosts: result.items,
            pagination: result.pagination
        };
    }
}