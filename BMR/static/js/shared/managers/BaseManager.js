import { PaginationRenderer } from '../renderers/PaginationRenderer.js';

export class BaseManager {
    constructor({
        authService,
        notificationService,
        repository,
        tableRenderer,
        filterHandler,
        getItemsFn = null,
        extractItemsFn = null,
        itemType = null,
        defaultPerPage = 30,
        defaultFilters = {}
    }) {
        if (!notificationService) {
            throw new Error('BaseManager requires a NotificationService instance');
        }
        this.authService = authService;
        this.notificationService = notificationService;
        this.repository = repository;
        this.tableRenderer = tableRenderer;
        this.filterHandler = filterHandler;

        this.getItemsFn = getItemsFn;
        this.extractItemsFn = extractItemsFn;
        this.itemType = itemType;

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
        this.notificationService.showError(message);
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

    async getItems(params) {
        if (this.getItemsFn) {
            return this.getItemsFn(params);
        }
        if (this.repository?.getList) {
            return this.repository.getList(params);
        }
        throw new Error('No getItemsFn or repository.getList defined');
    }

    extractItemsFromResponse(response) {
        if (this.extractItemsFn) {
            return this.extractItemsFn(response);
        }
        return response.items || response.results || [];
    }

    getItemType() {
        if (this.itemType) {
            return this.itemType;
        }
        return 'items';
    }

    async toggleStatus(id, isActive, confirmMessage = null) {
        const message = confirmMessage || `Delete ${this.getItemType().slice(0, -1)} "${title}"?`;
        if (!confirm(message)) return;

        try {
            const result = await this.repository.toggleStatus(id, isActive);
            const action = isActive ? "Activated" : "Deactivated";
            this.notificationService.showSuccess(`Item ${action} successfully!`);
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            this.notificationService.showError(`Failed to update status: ${error.message}`);
            throw error;
        }
    }

    async togglePublish(id, isPublished, confirmMessage = null) {
        const toggleMessage = confirmMessage || `Publish ${this.getItemType().slice(0, -1)} "${title}"?`;
        if (!confirm(toggleMessage)) return;

        try {
            const result = await this.repository.togglePublish(id, isPublished);
            const action = isPublished ? "Published" : "Unpublished";
            this.notificationService.showSuccess(`Item ${action} successfully!`);
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            this.notificationService.showError(`Failed to update status: ${error.message}`);
            throw error;
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