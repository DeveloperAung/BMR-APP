import { BaseTableRenderer } from '../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate, truncate } from '../../shared/utils/domUtils.js';

export class PostTableRenderer extends BaseTableRenderer {
    constructor() {
        super('postsTableBody');
    }

    render(posts) {
        if (!posts || posts.length === 0) {
            this.renderEmpty('No Posts Found', '📭');
            return;
        }
        this.tbody.innerHTML = posts.map(post => this.renderPostRow(post)).join('');
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
