import { BaseTableRenderer } from '../../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate } from '../../../shared/utils/domUtils.js';

export class MediaInfoTableRenderer extends BaseTableRenderer {
    constructor() {
        super('eventMediaInfoTableBody');
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

    render(mediaInfos, currentPage = 1, perPage = 10) {
        // Update pagination info
        this.setPagination(currentPage, perPage);
        console.log("Rendering event mediaInfos");
        
        if (!mediaInfos || mediaInfos.length === 0) {
            this.renderEmpty('No media information Found', '📂');
            return;
        }

        // Calculate starting serial number based on current page
        const startIndex = (this.currentPage - 1) * this.perPage;

        this.tbody.innerHTML = mediaInfos
            .map((mediaInfo, index) => this.renderMediaInfoRow(mediaInfo, startIndex + index + 1))
            .join('');
    }

    renderMediaInfoRow(mediaInfo, serialNumber) {
        return `
            <tr class="category-row" data-media-id="${mediaInfo.id}">
                <td class="text-center serial-number">
                    <span class="badge bg-primary text-dark">${serialNumber}</span>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(mediaInfo.event_title)}</p></td>
                <td><p class="f-light mb-0">${escapeHtml(mediaInfo.subcategory_title)}</p></td>
                <td>
                    <span class="badge ${mediaInfo.is_active ? 'bg-success' : 'bg-warning'}">
                        ${mediaInfo.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td><p class="f-light mb-0">${formatDate(mediaInfo.created_at)}</p></td>
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-media" data-media-id="${mediaInfo.id}" title="View Media">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-media" data-media-id="${mediaInfo.id}" title="Edit Media">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-media" data-media-id="${mediaInfo.id}" data-title="${escapeHtml(mediaInfo.title)}" title="Delete Media">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}