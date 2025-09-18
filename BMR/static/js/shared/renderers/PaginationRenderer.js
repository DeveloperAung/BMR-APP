import { escapeHtml } from '../utils/domUtils.js';

export class PaginationRenderer {
    constructor(containerId = 'paginationContainer') {
        this.container = document.getElementById(containerId);
    }

    render(pagination, onPageChange) {
        if (!this.container) return;
        if (!pagination) {
            this.container.innerHTML = '';
            return;
        }

        const { current_page, total_pages } = pagination;

        let html = `<nav aria-label="Page navigation">
            <ul class="pagination justify-content-end">`;

        // Previous button
        html += `
            <li class="page-item ${pagination.has_previous ? '' : 'disabled'}">
                <a class="page-link" href="#" data-page="${pagination.previous_page || current_page}">
                    Previous
                </a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= total_pages; i++) {
            html += `
                <li class="page-item ${i === current_page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Next button
        html += `
            <li class="page-item ${pagination.has_next ? '' : 'disabled'}">
                <a class="page-link" href="#" data-page="${pagination.next_page || current_page}">
                    Next
                </a>
            </li>
        `;

        html += `</ul></nav>`;

        this.container.innerHTML = html;

        // Attach events
        this.container.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page) && page !== current_page) {
                    onPageChange(page);
                }
            });
        });
    }
}
