import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class PermissionRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.EVENTS?.CATEGORIES || '/api/auth/groups/';
        super(endpoint); // must be called first
        this.notificationService = notificationService;
        console.log('Initializing PermissionRepository with endpoint:', endpoint);
    }

    // use role and permission as permission
    async submitPermission(permissionData) {
        if (!permissionData.title || permissionData.title.trim() === '') {
            throw new Error('Permission title is required');
        }

        const payload = {
            title: permissionData.title.trim(),
            is_active: true
        };

        try {
            return await super.createItem(payload);
        } catch (error) {
            throw error;
        }
    }

    async updatePermission(id, data) {
        if (!id) throw new Error('Permission ID is required for update');

        const payload = {};
        if (permission.title !== undefined) payload.title = permission.title.trim();

        if ('is_active' in data) {
            payload.is_active = Boolean(data.is_active);
        }
        if ('is_menu' in data) {
            payload.is_menu = Boolean(data.is_menu);
        }

        try {
            const result = await super.updateItem(id, payload);
            console.log('Permissions updated successfully', result);
            return result;
        } catch (error) {
            console.error('Update permission failed', error);
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getPermissions(params = {}) {
        return this.getList(params);
    }

    async getPermission(id) {
        return this.getItem(id);
    }

}