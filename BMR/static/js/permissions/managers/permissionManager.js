import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { PermissionRepository } from '../repositories/permissionRepository.js';
import { PermissonTableRenderer } from '../renderers/PermissionTableRenderer.js';
import { PermissionFilterHandler } from '../handlers/PermissionFilterHandler.js';

export class PermissionManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new PermissionRepository({ notificationService });
        const tableRenderer = new PermissionTableRenderer();
        const filterHandler = new PermissionFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,

            getItemsFn: (params) => repository.getPermissions(params),
            extractItemsFn: (response) => response.permission || response.items || response.results || [],
            itemType: 'permissions',

            defaultPerPage: 30,
            defaultFilters: {
                show_all: '',
                ordering: '-created_at'
            }
        });

        this.filterHandler = new PermissionFilterHandler(this.handleFiltersChange.bind(this));
    }

    async createPermission(data) {
        try {
            this.notificationService?.showLoading?.('Creating permission...');
            const response = await this.repository.submitPermission(data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async updatePermission(id, data) {
        try {
            this.notificationService?.showLoading?.('Updating permission...');
            const response = await this.repository.updatePermission(id, data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    // Category-specific methods
    async viewPermission(id) {
        console.log(`Viewing permission ${id}`);
        window.location.href = `/events/i/categories/${id}/`;
    }

    async editPermission(id) {
        console.log(`Editing permission ${id}`);
        window.location.href = `/events/i/categories/${id}/edit/`;
    }
}