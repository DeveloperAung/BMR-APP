import { BaseTableRenderer } from '../../../shared/renderers/BaseTableRenderer.js';
import { escapeHtml, formatDate } from '../../../shared/utils/domUtils.js';

export class EventTableRenderer extends BaseTableRenderer {
    constructor() {
        super('eventsTableBody');
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

    render(events, currentPage = 1, perPage = 10) {
        // Update pagination info
        this.setPagination(currentPage, perPage);

        if (!events || events.length === 0) {
            console.log("Event data", events)
            this.renderEmpty('No events Found', '📂');
            return;
        }
        // Calculate starting serial number based on current page
        const startIndex = (this.currentPage - 1) * this.perPage;
        this.tbody.innerHTML = events
            .map((event, index) => this.renderEventRow(event, startIndex + index + 1))
            .join('');
    }

    renderEventRow(event, serialNumber) {
        console.log("events data", event)
        return `
            <tr class="category-row" data-post-id="${event.id}">
                <td class="text-center serial-number">
                    <span class="badge bg-primary text-dark">${serialNumber}</span>
                </td>
                <td><p class="f-light mb-0">${escapeHtml(event.title)}</p></td>                
                <td><p class="f-light mb-0">${escapeHtml(event.event_category)}</p></td>                                           
                <td class="text-center">
                    <span class="fa-solid ${event.is_published ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}">
                    </span>
                </td> 
                <td><p class="f-light mb-0">${escapeHtml(event.published_date)}</p></td>  
                <td data-field="is_active">
                    <span class="badge ${ event.is_active ? 'bg-success' : 'bg-warning'}">
                        ${ event.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>                
                <td>
                    <div class="product-action">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-event" data-event-id="${event.id}" title="View Event">👁️</button>
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-event" data-event-id="${event.id}" title="Edit Event">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-event" data-event-id="${event.id}" data-title="${escapeHtml(event.title)}" title="Delete Event">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
}