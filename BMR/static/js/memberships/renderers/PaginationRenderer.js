// static/js/users/renderers/PaginationRenderer.js
export class PaginationRenderer {
    constructor() {
        this.container = document.getElementById('pagination');
        this.resultsInfo = document.getElementById('resultsInfo');
    }

    /**
     * Render pagination controls with safe null checking
     * @param {Object} pagination - Pagination data from API
     * @param {Function} onPageChange - Callback for page changes
     */
    render(pagination, onPageChange) {
        // Safe update of results info
        this.updateResultsInfo(pagination);

        // Early return if no pagination data or container
        if (!this.container || !pagination) {
            if (this.container) {
                this.container.innerHTML = '';
            }
            return;
        }

        // Safe extraction with defaults
        const totalPages = pagination.total_pages || pagination.num_pages || 1;

        if (totalPages <= 1) {
            this.container.innerHTML = '';
            return;
        }

        const html = this.buildPaginationHTML(pagination, onPageChange);
        this.container.innerHTML = html;
        this.attachEventListeners(onPageChange);
    }

    /**
     * Build pagination HTML structure with safe property access
     * @param {Object} pagination
     * @param {Function} onPageChange
     * @returns {string}
     */
    buildPaginationHTML(pagination) {
        // Safe extraction with fallbacks
        const currentPage = pagination.current_page || pagination.page || 1;
        const totalPages = pagination.total_pages || pagination.num_pages || 1;
        const hasPrevious = pagination.has_previous || (currentPage > 1);
        const hasNext = pagination.has_next || (currentPage < totalPages);
        const previousPage = pagination.previous_page || (currentPage - 1);
        const nextPage = pagination.next_page || (currentPage + 1);

        let html = '<nav aria-label="User pagination"><ul class="pagination justify-content-center">';

        // Previous button
        html += this.renderPreviousButton(hasPrevious, previousPage);

        // Page numbers
        html += this.renderPageNumbers(currentPage, totalPages);

        // Next button
        html += this.renderNextButton(hasNext, nextPage);

        html += '</ul></nav>';
        return html;
    }

    renderPreviousButton(hasPrevious, previousPage) {
        return `
            <li class="page-item ${!hasPrevious ? 'disabled' : ''}">
                <button class="page-link"
                        data-page="${previousPage || 1}"
                        ${!hasPrevious ? 'disabled' : ''}>
                    <i class="fa fa-chevron-left"></i> Previous
                </button>
            </li>
        `;
    }

    renderNextButton(hasNext, nextPage) {
        return `
            <li class="page-item ${!hasNext ? 'disabled' : ''}">
                <button class="page-link"
                        data-page="${nextPage || 1}"
                        ${!hasNext ? 'disabled' : ''}>
                    Next <i class="fa fa-chevron-right"></i>
                </button>
            </li>
        `;
    }

    renderPageNumbers(currentPage, totalPages) {
        const delta = 2; // Number of pages to show on each side of current page
        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);

        let html = '';

        // First page + ellipsis if needed
        if (start > 1) {
            html += this.renderPageButton(1, currentPage);
            if (start > 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Page numbers in range
        for (let i = start; i <= end; i++) {
            html += this.renderPageButton(i, currentPage);
        }

        // Last page + ellipsis if needed
        if (end < totalPages) {
            if (end < totalPages - 1) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            html += this.renderPageButton(totalPages, currentPage);
        }

        return html;
    }

    renderPageButton(page, currentPage) {
        const isActive = page === currentPage;
        return `
            <li class="page-item ${isActive ? 'active' : ''}">
                <button class="page-link" data-page="${page}">
                    ${page}
                </button>
            </li>
        `;
    }

    attachEventListeners(onPageChange) {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.page-link[data-page]') && !e.target.disabled) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page)) {
                    onPageChange(page);
                }
            }
        });
    }

    /**
     * Update results info with comprehensive null checking
     * @param {Object} pagination
     */
    updateResultsInfo(pagination) {
        if (!this.resultsInfo) return;

        if (!pagination) {
            this.resultsInfo.innerHTML = '<small class="text-muted">Loading...</small>';
            return;
        }

        // Handle different API response formats
        const currentPage = pagination.current_page || pagination.page || 1;
        const perPage = pagination.per_page || pagination.page_size || pagination.limit || 10;
        const totalCount = pagination.total_count || pagination.count || pagination.total || 0;
        const totalPages = pagination.total_pages || pagination.num_pages || Math.ceil(totalCount / perPage);

        // Calculate display range
        const start = Math.max(1, ((currentPage - 1) * perPage) + 1);
        const end = Math.min(currentPage * perPage, totalCount);

        // Safe number formatting
        const formatNumber = (num) => {
            if (typeof num !== 'number' || isNaN(num)) return '0';
            return num.toLocaleString();
        };

        this.resultsInfo.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    Showing ${formatNumber(start)} to ${formatNumber(end)}
                    of ${formatNumber(totalCount)} users
                </small>
                <small class="text-muted">
                    Page ${currentPage} of ${totalPages}
                </small>
            </div>
        `;
    }

    /**
     * Debug method to log pagination structure
     * @param {Object} pagination
     */
    debugPagination(pagination) {
        console.log('Pagination Debug:', {
            raw: pagination,
            current_page: pagination?.current_page,
            page: pagination?.page,
            total_pages: pagination?.total_pages,
            num_pages: pagination?.num_pages,
            total_count: pagination?.total_count,
            count: pagination?.count,
            per_page: pagination?.per_page,
            page_size: pagination?.page_size,
            has_next: pagination?.has_next,
            has_previous: pagination?.has_previous
        });
    }
}

// Usage example with error handling:
/*
const paginationRenderer = new PaginationRenderer();

// Before rendering, you can debug the structure
paginationRenderer.debugPagination(response);

// Then render safely
paginationRenderer.render(response, (page) => {
    console.log(`Going to page ${page}`);
});
*/