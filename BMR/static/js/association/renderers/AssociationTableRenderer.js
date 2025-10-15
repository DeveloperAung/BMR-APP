import { BaseTableRenderer } from '../../shared/renderers/BaseTableRenderer.js';
import {escapeHtml, formatDate, truncate} from '../../shared/utils/domUtils.js';
import {AssociationFormHandler} from "../handlers/AssociationFormHandler.js";

export class AssociationTableRenderer extends BaseTableRenderer {
    constructor() {
        super('postsTableBody');
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

    render(posts, currentPage = 1, perPage = 10) {
        // Update pagination info
        this.setPagination(currentPage, perPage);

        if (!posts || posts.length === 0) {
            console.log("Posts data", posts)
            this.renderEmpty('No Posts Found', '📂');
            return;
        }
        // Calculate starting serial number based on current page
        const startIndex = (this.currentPage - 1) * this.perPage;
        this.tbody.innerHTML = posts
            .map((post, index) => this.renderPostRow(post, startIndex + index + 1))
            .join('');
    }

    renderPostRow(post, serialNumber) {
        console.log("Posts data", post)
        return `
            <tr class="category-row" data-post-id="${post.id}">
                <td class="text-center serial-number">
                    <span class="badge bg-primary text-dark">${serialNumber}</span>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(post.title)}</p></td>                                                                           
                <td class="text-center">
                    <span class="fa-solid ${post.is_published ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}">
                    </span>
                </td> 
                <td><p class="f-light mb-0">${escapeHtml(post.published_by_email)}</p></td>  
                <td data-field="is_active">
                    <span class="badge ${ post.is_active ? 'bg-success' : 'bg-warning'}">
                        ${ post.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>                
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-asso-post" data-post-id="${post.id}" title="View Post">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-asso-post" data-post-id="${post.id}" title="Edit Post">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-asso-post" data-post-id="${post.id}" data-title="${escapeHtml(post.title)}" title="Delete Post">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}