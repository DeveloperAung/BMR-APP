import { BaseTableRenderer } from '../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate, truncate } from '../../shared/utils/domUtils.js';

export class AssociationTableRenderer extends BaseTableRenderer {
    constructor() {
        super('postsTableBody');
        this.currentPage = 1;
        this.perPage = 30;
    }

    setPagination(page, perPage) {
        this.currentPage = page || 1;
        this.perPage = perPage || 10;
    }

    render(posts, currentPage = 1, perPage = 10) {
        // Update pagination info
        this.setPagination(currentPage, perPage);

        if (!posts || posts.length === 0) {
            this.renderEmpty('No Posts Found', '📂');
            return;
        }

        // Calculate starting serial number based on current page
        const startIndex = (this.currentPage - 1) * this.perPage;
        this.tbody.innerHTML = posts
            .map((post, index) => this.renderPostRow(post, startIndex + index + 1))
            .join('');
    }

    renderPostRow(post) {
        return `
            <tr class="post-row" data-post-id="${post.id}">
                <td>
                    <div class="form-check">
                        <input class="form-check-input post-checkbox" type="checkbox" value="${post.id}"/>
                    </div>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(post.title)}</p></td>
                <td><p class="f-light mb-0">${escapeHtml(truncate(post.content, 150))}</p></td>
                <td class="text-center">
                    <span class="fa-solid ${post.is_published ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}">
                    </span>
                </td>
                <td><p class="f-light mb-0">${post.published_at ? formatDate(post.published_at) : '-'}</p></td>
                <td>
                    <span class="badge ${post.is_active ? 'bg-success' : 'bg-warning'}">
                        ${post.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-post" data-post-id="${post.id}" title="View Post">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-post" data-post-id="${post.id}" title="Edit Post">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-post" data-post-id="${post.id}" data-title="${escapeHtml(post.title)}" title="Delete Post">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}
