import { BaseTableRenderer } from '../../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate } from '../../../shared/utils/domUtils.js';

export class SubCategoryTableRenderer extends BaseTableRenderer {
    constructor() {
        super('eventSubCategoriesTableBody');
        this.currentPage = 1;
        this.perPage = 30; // Default items per page
    }

    /**
     * Set pagination info for correct Sr.No. calculation
     * @param {number} page - Current page number
     * @param {number} perPage - Items per page
     */
    setPagination(page, perPage) {
        this.currentPage = page || 1;
        this.perPage = perPage || 30;
    }

    render(subCategories, currentPage = 1, perPage = 30) {
        // Update pagination info
        this.setPagination(currentPage, perPage);

        if (!subCategories || subCategories.length === 0) {
            this.renderEmpty('No Subcategories Found', '📂');
            return;
        }

        // Calculate starting serial number based on current page
        const startIndex = (this.currentPage - 1) * this.perPage;

        this.tbody.innerHTML = subCategories
            .map((subCategory, index) => this.renderSubCategoryRow(subCategory, startIndex + index + 1))
            .join('');
    }

    renderSubCategoryRow(subCategory, serialNumber) {
        const categoryTitle = subCategory.event_category_title || 'N/A';

        return `
            <tr class="subcategory-row" data-subcategory-id="${subCategory.id}">
                <td class="text-center serial-number">
                    <span class="badge bg-primary text-dark">${serialNumber}</span>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(subCategory.title)}</p></td>
                <td><p class="f-light mb-0">${escapeHtml(categoryTitle)}</p></td>
                <td>
                    <span class="badge ${subCategory.is_active !== false ? 'bg-success' : 'bg-warning'}">
                        ${subCategory.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td><p class="f-light mb-0">${formatDate(subCategory.created_at)}</p></td>
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-subcategory" data-subcategory-id="${subCategory.id}" title="View Subcategory">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-subcategory" data-subcategory-id="${subCategory.id}" title="Edit Subcategory">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-subcategory" data-subcategory-id="${subCategory.id}" data-title="${escapeHtml(subCategory.title)}" title="Delete Subcategory">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}