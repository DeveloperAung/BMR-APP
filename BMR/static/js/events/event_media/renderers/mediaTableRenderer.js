import { BaseTableRenderer } from '../../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate } from '../../../shared/utils/domUtils.js';

export class MediaTableRenderer extends BaseTableRenderer {
    constructor() {
        super('eventMediasTableBody');
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

    render(medias, currentPage = 1, perPage = 10) {
        // Update pagination info
        this.setPagination(currentPage, perPage);
        console.log("Rendering event medias");
        
        if (!medias || medias.length === 0) {
            this.renderEmpty('No Medias Found', '📂');
            return;
        }

        // Calculate starting serial number based on current page
        const startIndex = (this.currentPage - 1) * this.perPage;

        this.tbody.innerHTML = medias
            .map((media, index) => this.renderMediaRow(media, startIndex + index + 1))
            .join('');
    }

    renderMediaRow(media, serialNumber) {
        return `
            <tr class="category-row" data-media-id="${media.id}">
                <td class="text-center serial-number">
                    <span class="badge bg-primary text-dark">${serialNumber}</span>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(media.title)}</p></td>
                <td><p class="f-light mb-0">${escapeHtml(media.event_title)}</p></td>
                <td>
                    <span class="badge ${media.is_active ? 'bg-success' : 'bg-warning'}">
                        ${media.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td><p class="f-light mb-0">${formatDate(media.created_at)}</p></td>
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-media" data-media-id="${media.id}" title="View Media">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-media" data-media-id="${media.id}" title="Edit Media">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-media" data-media-id="${media.id}" data-title="${escapeHtml(media.title)}" title="Delete Media">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}