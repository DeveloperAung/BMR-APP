import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../../shared/config/apiConfig.js';

export class RoleRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.AUTH?.ROLES || '/api/auth/groups/';
        super(endpoint);
        this.notificationService = notificationService;
        console.log('Initializing RoleRepository with endpoint:', endpoint);
    }

    async createRole(roleData) {
        if (!roleData.name || roleData.name.trim() === '') {
            throw new Error('Role name is required');
        }

        const payload = {
            name: roleData.name.trim(),
            permissions: roleData.permissions || []
        };

        try {
            return await super.createItem(payload);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async updateRole(id, roleData) {
        if (!id) throw new Error('Role ID is required for update');

        const payload = {};
        if (roleData.name !== undefined) payload.name = roleData.name.trim();
        if (roleData.permissions !== undefined) payload.permissions = roleData.permissions;

        try {
            return await super.updateItem(id, payload);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getRoleWithPermissions(roleId) {
        try {
            const role = await this.getItem(roleId);
            const permissions = await this.getRolePermissions(roleId);
            return { ...role, permissions };
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getRolePermissions(roleId) {
        try {
            const response = await this.axiosInstance.get(`${this.endpoint}${roleId}/permissions/`);
            return response.data;
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async updateRolePermissions(roleId, permissionIds) {
        try {
            const response = await this.axiosInstance.post(
                `${this.endpoint}${roleId}/permissions/`,
                { permissions: permissionIds }
            );
            return response.data;
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }
}
