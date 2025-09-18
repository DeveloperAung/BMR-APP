import { BaseTableRenderer } from '../../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate } from '../../../shared/utils/domUtils.js';

export class CategoryTableRenderer extends BaseTableRenderer {
    constructor() {
        super('donationCategoriesTableBody');
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

    render(categories, currentPage = 1, perPage = 10) {
        // Update pagination info
        this.setPagination(currentPage, perPage);

        if (!categories || categories.length === 0) {
            this.renderEmpty('No Categories Found', '📂');
            return;
        }

        // Calculate starting serial number based on current page
        const startIndex = (this.currentPage - 1) * this.perPage;
        this.tbody.innerHTML = categories
            .map((category, index) => this.renderCategoryRow(category, startIndex + index + 1))
            .join('');
    }

    renderCategoryRow(category, serialNumber) {
        return `
            <tr class="category-row" data-category-id="${category.id}">
                <td class="text-center serial-number">
                    <span class="badge bg-primary text-dark">${serialNumber}</span>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(category.title)}</p></td>
                <td class="text-center">
                    <span class="fa-solid ${category.is_date_required ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}">
                    </span>
                </td>
                <td class="text-center">
                    <span class="fa-solid ${category.is_multi_select_required ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}">
                    </span>
                </td>
                <td>
                    <span class="badge ${category.is_active ? 'bg-success' : 'bg-warning'}">
                        ${category.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td><p class="f-light mb-0">${formatDate(category.created_at)}</p></td>
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-category" data-category-id="${category.id}" title="View Category">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-category" data-category-id="${category.id}" title="Edit Category">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-category" data-category-id="${category.id}" data-title="${escapeHtml(category.title)}" title="Delete Category">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}