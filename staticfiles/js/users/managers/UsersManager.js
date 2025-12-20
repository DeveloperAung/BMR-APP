// static/js/users/managers/UsersManager.js
import { UserRepository } from '../repositories/UserRepository.js';
import { UserTableRenderer } from '../renderers/UserTableRenderer.js';
import { PaginationRenderer } from '../renderers/PaginationRenderer.js';
import { FilterHandler } from '../handlers/FilterHandler.js';

export class UsersManager {
    constructor({ authService, notificationService }) {
        console.log('🔧 UsersManager: Constructor called');
        this.authService = authService;
        this.notificationService = notificationService;

        this.userRepository = new UserRepository(authService);
        this.tableRenderer = new UserTableRenderer();
        this.paginationRenderer = new PaginationRenderer();
        this.filterHandler = new FilterHandler(this.handleFiltersChange.bind(this));

        this.state = {
            currentPage: 1,
            perPage: 30,
            filters: {
                search: '',
                is_staff: '',
                is_verified: '',
                ordering: '-date_joined'
            },
            users: [],
            pagination: null,
            loading: false
        };
    }

    async init() {
        this.setupEventListeners();
        await this.loadUsers();
    }

    setupEventListeners() {
        this.filterHandler.init();
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-user"]')) {
                this.viewUser(e.target.dataset.userId);
            } else if (e.target.matches('[data-action="edit-user"]')) {
                this.editUser(e.target.dataset.userId);
            } else if (e.target.matches('[data-action="delete-user"]')) {
                this.deleteUser(e.target.dataset.userId, e.target.dataset.username);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('staff-toggle')) {
                const userId = e.target.dataset.userId;
                const isStaff = e.target.checked;
                this.toggleStaff(userId, isStaff, e.target);
            }
        });
    }

    async loadUsers() {
        console.log('[UsersManager] Loading users...');
        this.showLoading(true);

        try {
            const queryParams = this.buildQueryParams();
            const result = await this.userRepository.getUsers(
                Object.fromEntries(new URLSearchParams(queryParams))
            );

            if (result.users.length > 0) {
                this.renderUsers(result.users);
                this.renderPagination(result.pagination);
                this.updateResultsInfo(result.pagination);
                this.showNotification('Users loaded successfully', 'success');
            } else {
                this.renderError('No users found.');
            }
        } catch (error) {
            this.log('Load users error', error.message);
            this.renderError(`Error loading users: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    renderUsers(users) {
        this.state.users = users;
        this.tableRenderer.render(users);
    }

    renderPagination(pagination) {
        this.state.pagination = pagination;
        this.paginationRenderer.render(pagination, this.goToPage.bind(this));
    }

    updateResultsInfo(pagination) {
        const infoEl = document.getElementById('resultsInfo');
        if (infoEl && pagination) {
            infoEl.textContent = `Showing page ${pagination.current_page} of ${pagination.total_pages} (total ${pagination.total_count} users)`;
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
        this.loadUsers();
    }

    goToPage(page) {
        this.state.currentPage = page;
        this.loadUsers();
    }

    async viewUser(userId) {
        try {
            const user = await this.userRepository.getUser(userId);
            const UserProfile = (await import('../components/UserProfile.js')).UserProfile;
            const profile = new UserProfile(user);
            profile.show();
        } catch (error) {
            this.showNotification('Failed to load user details', 'error');
        }
    }

    async editUser(userId) {
        if (!userId) return;
        window.location.href = `/i/users/${userId}/edit`;
    }

    async toggleStaff(userId, isStaff, checkboxEl) {
        if (!userId) return;
        try {
            await this.userRepository.updateItem(userId, { is_staff: isStaff });
            this.showNotification(`User staff status updated to ${isStaff ? 'staff' : 'user'}`, 'success');
        } catch (error) {
            this.showNotification('Failed to update staff status', 'error');
            if (checkboxEl) checkboxEl.checked = !isStaff; // revert UI on failure
        }
    }

    async deleteUser(userId, username) {
        if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
        try {
            await this.userRepository.deleteUser(userId);
            this.showNotification(`User "${username}" deleted successfully`, 'success');
            await this.loadUsers();
        } catch (error) {
            this.showNotification('Failed to delete user', 'error');
        }
    }

    log(message, data = null) {
        const ts = new Date().toLocaleTimeString();
        console.log(`[${ts}] UsersManager:`, message, data || '');
    }
}
