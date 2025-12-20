import { escapeHtml } from '../utils/domUtils.js';

export class BaseTableRenderer {
    constructor(tbodyId) {
        this.tbody = document.getElementById(tbodyId);
    }

    renderEmpty(message = 'No records found', icon = '📭') {
        this.tbody.innerHTML = `
            <tr>
                <td colspan="100%" class="text-center py-4">
                    <div class="empty-state">
                        <div class="empty-icon">${icon}</div>
                        <h5>${message}</h5>
                        <p class="text-muted">Try adjusting your search filters.</p>
                    </div>
                </td>
            </tr>
        `;
    }

    renderError(message) {
        this.tbody.innerHTML = `
            <tr>
                <td colspan="100%" class="text-center py-4">
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h5 class="text-danger">Error Loading Data</h5>
                        <p class="text-muted">${escapeHtml(message)}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fa fa-refresh"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}
