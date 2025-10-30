import { RoleRepository } from '../repositories/roleRepository.js';
import { NotificationService } from '../../../shared/services/NotificationService.js';

export class RoleTableRenderer {
    constructor(container, { notificationService } = {}) {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        this.notificationService = notificationService || new NotificationService();
        this.roleRepository = new RoleRepository({ notificationService: this.notificationService });
        
        this.initialize();
    }

    async initialize() {
        await this.loadRoles();
    }

    async loadRoles() {
        try {
            this.showLoading();
            const roles = await this.roleRepository.getAll();
            this.renderRoles(roles);
        } catch (error) {
            console.error('Error loading roles:', error);
            this.notificationService.showError('Failed to load roles');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading roles...</p>
            </div>
        `;
    }

    hideLoading() {
        // Loading state is cleared when rendering roles
    }

    renderRoles(roles) {
        if (!roles || roles.length === 0) {
            this.container.innerHTML = `
                <div class="alert alert-info">
                    No roles found. Create your first role to get started.
                </div>
            `;
            return;
        }

        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${roles.map(role => this.renderRoleRow(role)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.container.innerHTML = tableHtml;
        this.attachEventListeners();
    }

    renderRoleRow(role) {
        const createdAt = new Date(role.created_at).toLocaleString();
        
        return `
            <tr data-role-id="${role.id}">
                <td>${role.id}</td>
                <td>${this.escapeHtml(role.name)}</td>
                <td>${createdAt}</td>
                <td>
                    <div class="btn-group" role="group">
                        <a href="/roles/${role.id}/edit/" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-pencil"></i> Edit
                        </a>
                        <button type="button" class="btn btn-sm btn-outline-danger delete-role" data-role-id="${role.id}">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    attachEventListeners() {
        // Attach delete button handlers
        this.container.querySelectorAll('.delete-role').forEach(button => {
            button.addEventListener('click', this.handleDeleteClick.bind(this));
        });
    }

    async handleDeleteClick(e) {
        const roleId = e.currentTarget.dataset.roleId;
        if (!roleId) return;

        if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            return;
        }

        try {
            await this.roleRepository.deleteItem(roleId);
            this.notificationService.showSuccess('Role deleted successfully');
            
            // Remove the role row from the table
            const row = e.currentTarget.closest('tr');
            if (row) {
                row.remove();
                
                // If no more rows, show empty state
                if (this.container.querySelectorAll('tbody tr').length === 0) {
                    this.container.innerHTML = `
                        <div class="alert alert-info">
                            No roles found. Create your first role to get started.
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            this.notificationService.showError('Failed to delete role');
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
