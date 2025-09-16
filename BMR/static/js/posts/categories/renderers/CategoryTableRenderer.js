import { BaseTableRenderer } from '../../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate } from '../../../shared/utils/domUtils.js';

export class CategoryTableRenderer extends BaseTableRenderer {
    constructor() {
        super('postCategoriesTableBody');
    }

    render(categories) {
        if (!categories || categories.length === 0) {
            this.renderEmpty('No Categories Found', '📂');
            return;
        }
        this.tbody.innerHTML = categories.map(cat => this.renderRow(cat)).join('');
    }

    renderRow(cat) {
        return `
            <tr class="category-row" data-category-id="${cat.id}">
                <td><p class="f-light mb-0">${escapeHtml(cat.title)}</p></td>
                <td>
                    <span class="badge ${cat.is_active ? 'bg-success' : 'bg-danger'}">
                        ${cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td><p class="f-light mb-0">${formatDate(cat.created_at)}</p></td>
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary"
                                data-action="edit-category"
                                data-category-id="${cat.id}">✏️</button>
                        <button class="btn btn-sm btn-outline-danger"
                                data-action="delete-category"
                                data-category-id="${cat.id}"
                                data-title="${escapeHtml(cat.title)}">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}
