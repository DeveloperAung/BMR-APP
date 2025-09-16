// static/js/events/subcategories/managers/SubCategoryManager.js
import { EventSubCategoryRepository } from '../repositories/EventSubCategoryRepository.js';
import { SubCategoryTableRenderer } from '../renderers/SubCategoryTableRenderer.js';
import { PaginationRenderer } from '../../../shared/renderers/PaginationRenderer.js';
import { SubCategoryFilterHandler } from '../handlers/SubCategoryFilterHandler.js';

export class SubCategoryManager {
    constructor({ authService, notificationService }) {
        console.log('SubCategoryManager: Constructor called');
        this.authService = authService;
        this.notificationService = notificationService;

        this.subCategoryRepository = new EventSubCategoryRepository(authService);
        this.tableRenderer = new SubCategoryTableRenderer();
        this.currentPage = 1;
        this.perPage = 30;
        this.paginationRenderer = new PaginationRenderer();

        this.filterHandler = new SubCategoryFilterHandler(this.handleFiltersChange.bind(this));

        this.state = {
            currentPage: 1,
            perPage: 30,
            filters: { search: '', event_category: '', ordering: '-created_at' },
            subCategories: [],
            pagination: null,
            loading: false
        };
    }

    async init() {
        this.setupEventListeners();
        this.filterHandler.init();
        await this.loadEventCategories();
        await this.loadSubCategories();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-subcategory"]')) {
                this.viewSubCategory(e.target.dataset.subcategoryId);
            } else if (e.target.matches('[data-action="edit-subcategory"]')) {
                this.editSubCategory(e.target.dataset.subcategoryId);
            } else if (e.target.matches('[data-action="delete-subcategory"]')) {
                this.deleteSubCategory(e.target.dataset.subcategoryId, e.target.dataset.title);
            }
        });
    }

    async loadEventCategories() {
        try {
            const categories = await this.subCategoryRepository.getEventCategories();
            this.populateCategoryFilter(categories);
        } catch (error) {
            console.error('Failed to load event categories:', error);
        }
    }

    populateCategoryFilter(categories) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        // Keep the "All Categories" option and add categories
        const currentValue = categoryFilter.value;
        const optionsHtml = categories.map(category =>
            `<option value="${category.id}">${category.title}</option>`
        ).join('');

        categoryFilter.innerHTML = `
            <option value="">All Categories</option>
            ${optionsHtml}
        `;

        // Restore selected value if it exists
        if (currentValue) {
            categoryFilter.value = currentValue;
        }
    }

    async loadSubCategories(page = 1) {
        console.log('SubCategoryManager: Loading subcategories');
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

            const response = await this.subCategoryRepository.getSubCategories(params);

            const subCategories = response.subCategories || response.items || response.results || [];

            this.state.subCategories = subCategories;
            this.state.pagination = response.pagination;

            this.tableRenderer.render(
                subCategories,
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

    handleFiltersChange(filters) {
        this.state.filters = filters;
        this.state.currentPage = 1;
        this.loadSubCategories(1);
    }

    goToPage(page) {
        this.state.currentPage = page;
        this.loadSubCategories(page);
    }

    async viewSubCategory(subCategoryId) {
        console.log(`Viewing subcategory ${subCategoryId}`);
        // Implement view functionality
    }

    async editSubCategory(subCategoryId) {
        console.log(`Editing subcategory ${subCategoryId}`);
        // Implement edit functionality
    }

    async deleteSubCategory(subCategoryId, title) {
        if (!confirm(`Delete subcategory "${title}"?`)) return;

        try {
            await this.subCategoryRepository.deleteSubCategory(subCategoryId);
            this.showNotification(`Subcategory "${title}" deleted successfully`, 'success');
            await this.loadSubCategories(this.state.currentPage);
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Failed to delete subcategory', 'error');
        }
    }
}