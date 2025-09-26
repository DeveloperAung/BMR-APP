// static/js/posts/managers/AssociationManager.js
import { AssociationRepository } from '../repositories/MembershipRepository.js';
import { MembershipTableRenderer } from '../renderers/MembershipTableRenderer.js';
import { PaginationRenderer } from '../renderers/PaginationRenderer.js';
import { FilterHandler } from '../handlers/FilterHandler.js';

export class AssociationManager {
    constructor({ authService, notificationService }) {
        console.log('🔧 AssociationManager: Constructor called');
        this.authService = authService;
        this.notificationService = notificationService;

        this.assoRepository = new AssociationRepository(authService);
        this.tableRenderer = new AssociationTableRenderer();
        this.paginationRenderer = new PaginationRenderer();
        this.filterHandler = new FilterHandler(this.handleFiltersChange.bind(this));

        this.state = {
            currentPage: 1,
            perPage: 30,
            filters: { search: '', is_active: '', ordering: '-published_at' },
            posts: [],
            pagination: null,
            loading: false
        };
    }

    async init() {
        this.setupEventListeners();
        await this.loadPosts();
    }

    setupEventListeners() {
        this.filterHandler.init();
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-post"]')) {
                this.viewPost(e.target.dataset.postId);
            } else if (e.target.matches('[data-action="edit-post"]')) {
                this.editPost(e.target.dataset.postId);
            } else if (e.target.matches('[data-action="delete-post"]')) {
                this.deletePost(e.target.dataset.postId, e.target.dataset.title);
            }
        });
    }

    async loadPosts() {
        console.log('[AssociationManager] Loading posts...');
        this.showLoading(true);

        try {
            const queryParams = this.buildQueryParams();
            const result = await this.assoRepository.getAssoPosts(
                Object.fromEntries(new URLSearchParams(queryParams))
            );

            if (result.assoPosts.length > 0) {
                this.tableRenderer.render(result.assoPosts);
                this.renderPagination(result.pagination);
                this.updateResultsInfo(result.pagination);
                this.showNotification('Posts loaded successfully', 'success');
            } else {
                this.renderError('No posts found.');
            }
        } catch (error) {
            this.renderError(`Error loading posts: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    renderPagination(pagination) {
        this.state.pagination = pagination;
        this.paginationRenderer.render(pagination, this.goToPage.bind(this));
    }

    updateResultsInfo(pagination) {
        const infoEl = document.getElementById('resultsInfo');
        if (infoEl && pagination) {
            infoEl.textContent = `Page ${pagination.current_page} of ${pagination.total_pages} (${pagination.total_count} posts)`;
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
        this.loadPosts();
    }

    goToPage(page) {
        this.state.currentPage = page;
        this.loadPosts();
    }

    async viewPost(postId) {
        console.log(`Viewing post ${postId}`);
    }

    async editPost(postId) {
        console.log(`Editing post ${postId}`);
    }

    async deletePost(postId, title) {
        if (!confirm(`Delete post "${title}"?`)) return;
        try {
            await this.assoRepository.deletePost(postId);
            this.showNotification(`Post "${title}" deleted successfully`, 'success');
            await this.loadPosts();
        } catch (error) {
            this.showNotification('Failed to delete post', 'error');
        }
    }
}
