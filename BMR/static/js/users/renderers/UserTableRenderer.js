import { BaseTableRenderer } from '../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate } from '../../shared/utils/domUtils.js';

export class UserTableRenderer extends BaseTableRenderer {
    constructor() {
        super('usersTableBody');
    }

    render(users) {
        if (!users || users.length === 0) {
            this.renderEmpty('No Users Found', '👥');
            return;
        }
        this.tbody.innerHTML = users.map(user => this.renderUserRow(user)).join('');
    }

    renderUserRow(user) {
        return `
            <tr class="user-row" data-user-id="${user.id}">
                <td>
                    <div class="form-check">
                        <input class="form-check-input user-checkbox" type="checkbox" value="${user.id}"/>
                    </div>
                </td>
                <td>
                    <div class="product-names">
                        <div class="light-product-box">
                            <img class="img-fluid user-avatar"
                                 src="${user.profile_picture || '/static/assets/images/user/1.jpg'}"
                                 alt="${user.username}"
                                 onerror="this.src='/static/assets/images/user/1.jpg'"/>
                        </div>
                        <div>
                            <p class="mb-0 fw-bold">${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}</p>
                            <small class="text-muted">@${escapeHtml(user.username)}</small>
                        </div>
                    </div>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(user.email)}</p></td>
                <td><p class="f-light mb-0">${escapeHtml(user.username)}</p></td>
                <td>
                    <span class="badge ${user.is_staff ? 'bg-success' : 'bg-primary'}">
                        ${user.is_staff ? 'Staff' : 'User'}
                    </span>
                </td>
                <td class="text-center">
                    <span class="fa-solid ${user.is_email_verified ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}">
                    </span>
                </td>
                <td><p class="f-light mb-0">${formatDate(user.date_joined)}</p></td>
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-user" data-user-id="${user.id}" title="View User">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-user" data-user-id="${user.id}" title="Edit User">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-user" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}" title="Delete User">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}
