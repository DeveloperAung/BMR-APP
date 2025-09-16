// static/js/categories/managers/CategoryManager.js
import { PostCategoryRepository } from '../repositories/PostCategoryRepository.js';
import { CategoryTableRenderer } from '../renderers/CategoryTableRenderer.js';
import { CategoryFilterHandler } from '../handlers/CategoryFilterHandler.js';
import { PaginationRenderer } from '../../../shared/renderers/PaginationRenderer.js';

export class CategoryManager {
    constructor({ authService, notificationService }) {
        this.authService = authService;
        this.notificationService = notificationService;

        // repositories
        this.repository = new PostCategoryRepository(authService);

        // renderers
        this.tableRenderer = new CategoryTableRenderer('postCategoriesTableBody');
        this.paginationRenderer = new PaginationRenderer('categoriesPagination');

        // handlers
        this.filterHandler = new CategoryFilterHandler(this.handleFiltersChange.bind(this));

        // state
        this.state = {
            currentPage: 1,
            perPage: 10,
            filters: {
                search: '',
                show_all: false
            },
            categories: [],
            pagination: null,
            loading: false
        };
    }

    async init() {
        this.setupEventListeners();
        await this.loadCategories();
    }

    setupEventListeners() {
        this.filterHandler.init();

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
        this.setState({ loading: true, currentPage: page });
        try {
            const params = {
                page: this.state.currentPage,
                per_page: this.state.perPage,
                search: this.state.filters.search,
                show_all: this.state.filters.show_all
            };

            const result = await this.repository.getCategories(params);

            console.log('result', result)

            if (result.results && Array.isArray(result.results)) {
                this.state.categories = result.results;
                this.state.pagination = result.pagination;

                this.tableRenderer.render(this.state.categories);
                this.paginationRenderer.render(result.pagination, (newPage) => this.loadCategories(newPage));
                this.updateResultsInfo(result.pagination);

                this.notificationService?.showSuccess?.('Categories loaded successfully');
            } else {
                this.tableRenderer.renderEmpty('No categories found');
            }
        } catch (error) {
            console.error('[CategoryManager] Error loading categories:', error);
            this.tableRenderer.renderError(error.message || 'Failed to load categories');
            this.notificationService?.showError?.('Failed to load categories', error);
        } finally {
            this.setState({ loading: false });
        }
    }

    updateResultsInfo(pagination) {
        const info = document.getElementById('categoriesResultsInfo');
        if (!info || !pagination) return;

        info.textContent = `Page ${pagination.current_page} of ${pagination.total_pages} 
            (Total: ${pagination.total_count})`;
    }

    handleFiltersChange(filters) {
        this.setState({ filters, currentPage: 1 });
        this.loadCategories(1);
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    // CRUD actions
    async viewCategory(categoryId) {
        console.log(`View category ${categoryId}`);
        // TODO: open modal and show details
    }

    async editCategory(categoryId) {
        console.log(`Edit category ${categoryId}`);
        // TODO: open modal with form
    }

    async deleteCategory(categoryId, title) {
        if (!confirm(`Delete category "${title}"? This cannot be undone.`)) return;

        try {
            await this.repository.deleteCategory(categoryId);
            this.notificationService?.showSuccess?.(`Category "${title}" deleted successfully`);
            await this.loadCategories(this.state.currentPage);
        } catch (error) {
            this.notificationService?.showError?.('Failed to delete category', error);
        }
    }
}
