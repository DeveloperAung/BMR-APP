import { BaseTableRenderer } from '../../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate } from '../../../shared/utils/domUtils.js';

export class PermissionTableRenderer extends BaseTableRenderer {
    constructor() {
        super('permissionsTableBody');
        this.currentPage = 1;
        this.perPage = 10; // Default items per page
    }

    /**
     * Set pagination info for correct Sr.No. calculation
     * @param {number} page - Current page number
     * @param {number} perPage - Items per page
     */
    setPagination(page, perPage) {
        this.currentPage = page || 1;
        this.perPage = perPage || 10;
    }

    render(permissions, currentPage = 1, perPage = 10) {
        // Update pagination info
        this.setPagination(currentPage, perPage);
        console.log("Rendering role permissions");
        
        if (!permissions || permissions.length === 0) {
            this.renderEmpty('No role permissions Found', '📂');
            return;
        }

        // Calculate starting serial number based on current page
        const startIndex = (this.currentPage - 1) * this.perPage;

        this.tbody.innerHTML = permissions
            .map((permission, index) => this.renderPermissionsRow(permission, startIndex + index + 1))
            .join('');
    }

    renderPermissionsRow(permission, serialNumber) {
        return `
            <tr class="permission-row" data-category-id="${permission.id}">
                <td class="text-center serial-number">
                    <span class="badge bg-primary text-dark">${serialNumber}</span>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(category.title)}</p></td>
                <td>
                    <span class="badge ${permission.is_active ? 'bg-success' : 'bg-warning'}">
                        ${permission.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td><p class="f-light mb-0">${formatDate(permission.created_at)}</p></td>
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-permission" data-permission-id="${permission.id}" title="View Permission">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-permission" data-permission-id="${permission.id}" title="Edit Permission">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-permission" data-permission-id="${permission.id}" data-title="${escapeHtml(permission.title)}" title="Delete Permission">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}