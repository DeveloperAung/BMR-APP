import { BaseTableRenderer } from '../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate, truncate } from '../../shared/utils/domUtils.js';

export class MembershipTableRenderer extends BaseTableRenderer {
    constructor() {
        super('membershipsTableBody');
        this.currentPage = 1;
        this.perPage = 10;
    }

    setPagination(page, perPage) {
        this.currentPage = page || 1;
        this.perPage = perPage || 10;
    }

    render(memberships, currentPage = 1, perPage = 10) {
       this.setPagination(currentPage, perPage);
        if (!memberships || memberships.length === 0) {
            this.renderEmpty('No memberships Found', '📂');
            return;
        }

        const startIndex = (this.currentPage - 1) * this.perPage;
        this.tbody.innerHTML = memberships.items
            .map((data, index) => this.renderMembershipRow(data, startIndex + index + 1))
            .join('');
    }

    renderMembershipRow(data, serialNumber) {
        return `
            <tr class="membership-row" data-membership-id="${data.id}">
                <td class="text-center serial-number">
                    <span class="badge bg-primary text-dark">${serialNumber}</span>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(data.user)}</p></td>
                <td><p class="f-light mb-0">${escapeHtml(data.reference_no)}</p></td>
                <td><p class="f-light mb-0">${escapeHtml(data.membership_type_name)}</p></td>
                <td><p class="f-light mb-0">${escapeHtml(data.applied_date)}</p></td>
                <td><p class="f-light mb-0">${escapeHtml(data.workflow_status_name)}</p></td>
                <td class="text-center">
                    
                </td>                
                <td>
                    <span class="badge ${data.is_active ? 'bg-success' : 'bg-warning'}">
                        ${data.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-membership" data-membership-id="${data.id}" title="View Membership">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-membership" data-membership-id="${data.id}" title="Edit Membership">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-membership" data-membership-id="${data.id}" data-title="${escapeHtml(data.user)}" title="Delete Membership">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}
