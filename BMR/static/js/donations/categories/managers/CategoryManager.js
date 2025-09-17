// static/js/posts/categories/managers/CategoryManager.js
import { DonationCategoryRepository } from '../repositories/DonationCategoryRepository.js';
import { CategoryTableRenderer } from '../renderers/CategoryTableRenderer.js';
import { PaginationRenderer } from '../../../shared/renderers/PaginationRenderer.js';
import { CategoryFilterHandler } from '../handlers/CategoryFilterHandler.js';
//import { CategoryBulkActionHandler } from '../handlers/CategoryBulkActionHandler.js';

export class CategoryManager {
    constructor({ authService, notificationService }) {
        this.authService = authService;
        this.notificationService = notificationService;

        this.categoryRepository = new DonationCategoryRepository(authService);
        this.tableRenderer = new CategoryTableRenderer();
        this.currentPage = 1;
        this.perPage = 10;
        this.paginationRenderer = new PaginationRenderer();

        this.filterHandler = new CategoryFilterHandler(this.handleFiltersChange.bind(this));
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
        this.filterHandler.init();
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

            const response = await this.categoryRepository.getCategories(params);

            const categories = response.categories || response.items || response.results || [];

            this.state.Categories = categories;
            this.state.pagination = response.pagination;

            this.tableRenderer.render(
                categories,
                this.state.currentPage,
                this.state.perPage
            );

            if (response.pagination) {
                this.renderPagination(response.pagination);
                this.updateResultsInfo(response.pagination);
            }

        } catch (error) {
            console.error('Failed to load subcategories:', error);
            this.renderError('Failed to load subcategories. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    renderPagination(pagination) {
        this.paginationRenderer.render(pagination, this.goToPage.bind(this));
    }

    updateResultsInfo(pagination) {
        const infoEl = document.getElementById('resultsInfo');
        if (infoEl && pagination) {
            infoEl.textContent = `Page ${pagination.current_page} of ${pagination.total_pages} (${pagination.total_count} subcategories)`;
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
        this.loadCategories(1);
    }

    goToPage(page) {
        this.state.currentPage = page;
        this.loadCategories(page);
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