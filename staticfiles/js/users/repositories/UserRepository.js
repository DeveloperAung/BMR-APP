import { BaseRepository } from '../../shared/repositories/BaseRepository.js';
import { USERS } from '../../shared/config/apiConfig.js';

export class UserRepository extends BaseRepository {
    constructor() {
        super(USERS.USERS);
    }

    async getUsers(params = {}) {

        const result = await this.getList(params);

        return {
            users: result.items,
            pagination: result.pagination
        };
    }

    async getUser(userId) {
        console.log('🔧 UserRepository.getUser called with userId:', userId);
        return this.getItem(userId);
    }

    async createUser(userData) {
        return this.createItem(userData);
    }

    async updateUser(userId, userData) {
        return this.updateItem(userId, userData);
    }

    async deleteUser(userId) {
        return this.deleteItem(userId);
    }
}
