// static/js/posts/categories/managers/CategoryManager.js
import { EventCategoryRepository } from '../repositories/EventCategoryRepository.js';
import { CategoryTableRenderer } from '../renderers/CategoryTableRenderer.js';
import { PaginationRenderer } from '../../../shared/renderers/PaginationRenderer.js';
//import { FilterHandler } from '../handlers/CategoryFilterHandler.js';
//import { CategoryBulkActionHandler } from '../handlers/CategoryBulkActionHandler.js';

export class CategoryManager {
    constructor({ authService, notificationService }) {
        console.log('CategoryManager: Constructor called');
        this.authService = authService;
        this.notificationService = notificationService;

        this.categoryRepository = new EventCategoryRepository(authService);
        this.tableRenderer = new CategoryTableRenderer();
        this.currentPage = 1;
        this.perPage = 10;
        this.paginationRenderer = new PaginationRenderer();

//        this.filterHandler = new FilterHandler(this.handleFiltersChange.bind(this));
//        this.bulkActionHandler = new CategoryBulkActionHandler();

        this.state = {
            currentPage: 1,
            perPage: 30,
            filters: { search: '', show_all: '', ordering: '-created_at' },
            categories: [],
            pagination: null,
            loading: false
        };
    }

    async init() {
        this.setupEventListeners();
//        this.bulkActionHandler.init();
        await this.loadCategories();
    }

    setupEventListeners() {
//        this.filterHandler.init();
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-category"]')) {
                this.viewCategory(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="edit-category"]')) {
                this.editCategory(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="delete-category"]')) {
                this.deleteCategory(e.target.dataset.categoryId, e.target.dataset.title);
            }
        });
    }

    async loadCategories(page = 1) {
        console.log('CategoryManager: called categories');
        try {
            this.currentPage = page;

            const response = await this.categoryRepository.getCategories({
                page: this.currentPage,
                per_page: this.perPage
            });

            // FIX: use response.categories instead of items/results
            const categories = response.categories || response.items || response.results || [];

            this.tableRenderer.render(
                categories,
                this.currentPage,
                this.perPage
            );

            // Update pagination UI if you have one
            if (response.pagination) {
                this.renderPagination(response.pagination);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    onPageChange(newPage) {
        this.loadCategories(newPage);
    }

    onPerPageChange(newPerPage) {
        this.perPage = newPerPage;
        this.currentPage = 1; // Reset to first page
        this.loadCategories(1);
    }

    renderPagination(pagination) {
        this.state.pagination = pagination;
        this.paginationRenderer.render(pagination, this.goToPage.bind(this));
    }

    updateResultsInfo(pagination) {
        const infoEl = document.getElementById('resultsInfo');
        if (infoEl && pagination) {
            infoEl.textContent = `Page ${pagination.current_page} of ${pagination.total_pages} (${pagination.total_count} categories)`;
        }
    }

    renderError(message) {
        this.tableRenderer.renderError(message);
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        if (!this.notificationService) return;
        switch (type) {
            case 'success': this.notificationService.showSuccess(message); break;
            case 'error': this.notificationService.showError(message); break;
            case 'warning': this.notificationService.showWarning(message); break;
            default: this.notificationService.showInfo(message);
        }
    }

    showLoading(isLoading = true) {
        this.state.loading = isLoading;
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = isLoading ? 'block' : 'none';
    }

    buildQueryParams() {
        const params = new URLSearchParams();
        params.append('page', this.state.currentPage);
        params.append('per_page', this.state.perPage);
        Object.entries(this.state.filters).forEach(([k, v]) => v && params.append(k, v));
        return params.toString();
    }

    handleFiltersChange(filters) {
        this.state.filters = filters;
        this.state.currentPage = 1;
        this.loadCategories();
    }

    goToPage(page) {
        this.state.currentPage = page;
        this.loadCategories();
    }

    async viewCategory(categoryId) {
        console.log(`Viewing category ${categoryId}`);
    }

    async editCategory(categoryId) {
        console.log(`Editing category ${categoryId}`);
    }

    async deleteCategory(categoryId, title) {
        if (!confirm(`Delete category "${title}"?`)) return;
        try {
            await this.categoryRepository.deleteCategory(categoryId);
            this.showNotification(`Category "${title}" deleted successfully`, 'success');
            await this.loadCategories();
        } catch (error) {
            this.showNotification('Failed to delete category', 'error');
        }
    }
}