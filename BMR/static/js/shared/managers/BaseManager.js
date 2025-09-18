import { PaginationRenderer } from '../renderers/PaginationRenderer.js';

export class BaseManager {
    constructor({
        authService,
        notificationService,
        repository,
        tableRenderer,
        filterHandler,
        defaultPerPage = 30,
        defaultFilters = {}
    }) {
        this.authService = authService;
        this.notificationService = notificationService;
        this.repository = repository;
        this.tableRenderer = tableRenderer;
        this.filterHandler = filterHandler;

        this.paginationRenderer = new PaginationRenderer();

        this.state = {
            currentPage: 1,
            perPage: defaultPerPage,
            filters: {
                search: '',
                ordering: '-created_at',
                ...defaultFilters
            },
            items: [],
            pagination: null,
            loading: false
        };
    }

    async init() {
        this.setupEventListeners();
        if (this.filterHandler) {
            this.filterHandler.init();
        }
        await this.loadItems();
    }

    setupEventListeners() {
        // This method should be overridden by child classes
        // to handle specific actions like view, edit, delete
    }

    async loadItems(page = 1) {
        try {
            this.showLoading(true);
            this.state.currentPage = page;

            const params = {
                page: this.state.currentPage,
                per_page: this.state.perPage,
                ...this.state.filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await this.getItems(params);
            const items = this.extractItemsFromResponse(response);

            this.state.items = items;
            this.state.pagination = response.pagination;

            this.renderItems(items);

            if (response.pagination) {
                this.renderPagination(response.pagination);
                this.updateResultsInfo(response.pagination);
            }

        } catch (error) {
            console.error(`Failed to load ${this.getItemType()}:`, error);
            this.renderError(`Failed to load ${this.getItemType()}. Please try again.`);
        } finally {
            this.showLoading(false);
        }
    }

    renderItems(items) {
        this.tableRenderer.render(
            items,
            this.state.currentPage,
            this.state.perPage
        );
    }

    renderPagination(pagination) {
        this.paginationRenderer.render(pagination, this.goToPage.bind(this));
    }

    updateResultsInfo(pagination) {
        const infoEl = document.getElementById('resultsInfo');
        if (infoEl && pagination) {
            const itemType = this.getItemType();
            infoEl.textContent = `Page ${pagination.current_page} of ${pagination.total_pages} (${pagination.total_count} ${itemType})`;
        }
    }

    renderError(message) {
        this.tableRenderer.renderError(message);
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        if (!this.notificationService) return;

        switch (type) {
            case 'success':
                this.notificationService.showSuccess(message);
                break;
            case 'error':
                this.notificationService.showError(message);
                break;
            case 'warning':
                this.notificationService.showWarning(message);
                break;
            default:
                this.notificationService.showInfo(message);
        }
    }

    showLoading(isLoading = true) {
        this.state.loading = isLoading;
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = isLoading ? 'block' : 'none';
        }
    }

    handleFiltersChange(filters) {
        this.state.filters = filters;
        this.state.currentPage = 1;
        this.loadItems(1);
    }

    goToPage(page) {
        this.state.currentPage = page;
        this.loadItems(page);
    }

    // Template methods that should be implemented by child classes
    async getItems(params) {
        throw new Error('getItems method must be implemented by child class');
    }

    extractItemsFromResponse(response) {
        // Default implementation, can be overridden
        return response.items || response.results || [];
    }

    getItemType() {
        // Should return a string like 'categories', 'subcategories', etc.
        throw new Error('getItemType method must be implemented by child class');
    }

    // Common CRUD operations that can be used by child classes
    async deleteItem(itemId, title, confirmMessage = null) {
        const message = confirmMessage || `Delete ${this.getItemType().slice(0, -1)} "${title}"?`;
        if (!confirm(message)) return;

        try {
            await this.repository.deleteItem(itemId);
            this.showNotification(`${title} deleted successfully`, 'success');
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification(`Failed to delete ${this.getItemType().slice(0, -1)}`, 'error');
        }
    }

    async viewItem(itemId) {
        console.log(`Viewing ${this.getItemType().slice(0, -1)} ${itemId}`);
        // Override in child class for specific implementation
    }

    async editItem(itemId) {
        console.log(`Editing ${this.getItemType().slice(0, -1)} ${itemId}`);
        // Override in child class for specific implementation
    }

    // Utility methods
    buildQueryParams() {
        const params = new URLSearchParams();
        params.append('page', this.state.currentPage);
        params.append('per_page', this.state.perPage);

        Object.entries(this.state.filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        return params.toString();
    }

    updateFilters(newFilters) {
        this.state.filters = { ...this.state.filters, ...newFilters };
        this.state.currentPage = 1;
        this.loadItems(1);
    }

    resetFilters() {
        this.state.filters = {
            search: '',
            ordering: '-created_at'
        };
        this.state.currentPage = 1;
        if (this.filterHandler) {
            this.filterHandler.clearAllFilters();
        }
        this.loadItems(1);
    }

    getCurrentState() {
        return { ...this.state };
    }

    setPerPage(perPage) {
        this.state.perPage = perPage;
        this.state.currentPage = 1;
        this.loadItems(1);
    }
}