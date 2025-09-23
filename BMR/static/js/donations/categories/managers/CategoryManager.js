// static/js/donations/categories/managers/CategoryManager.js
import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { DonationCategoryRepository } from '../repositories/DonationCategoryRepository.js';
import { CategoryTableRenderer } from '../renderers/CategoryTableRenderer.js';
import { CategoryFilterHandler } from '../handlers/CategoryFilterHandler.js';

export class CategoryManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new DonationCategoryRepository({ notificationService });
        const tableRenderer = new CategoryTableRenderer();
        const filterHandler = new CategoryFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,
            defaultPerPage: 30,
            defaultFilters: {
                show_all: '',
                ordering: '-created_at'
            }
        });

        this.filterHandler = new CategoryFilterHandler(this.handleFiltersChange.bind(this));
    }

    setupEventListeners() {
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

    // Implement required template methods
    async getItems(params) {
        return await this.repository.getCategories(params);
    }

    extractItemsFromResponse(response) {
        return response.categories || response.items || response.results || [];
    }

    getItemType() {
        return 'categories';
    }

    async createCategory(categoryData) {
        try {
            this.notificationService?.showLoading?.('Creating category...');
            const response = await this.repository.submitCategory(categoryData);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async updateCategory(categoryId, categoryData) {
        try {
            this.notificationService?.showLoading?.('Updating category...');
            const response = await this.repository.updateCategory(categoryId, categoryData);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    // Category-specific methods
    async viewCategory(categoryId) {
        console.log(`Viewing category ${categoryId}`);
        // Implement specific view logic - could open modal or navigate to detail page
        window.location.href = `/donations/i/categories/${categoryId}/`;
    }

    async editCategory(categoryId) {
        console.log(`Editing category ${categoryId}`);
        // Navigate to edit page
        window.location.href = `/donations/i/categories/${categoryId}/edit/`;
    }

    async toggleCategoryStatus(id, isActive) {
        const result = await this.repository.toggleStatus(id, isActive);
        const action = isActive ? "reactivated" : "deactivated";
        this.notificationService.showSuccess(`Category ${action} successfully!`);
        return result;
    }

    async bulkDeleteCategories(categoryIds) {
        if (!confirm(`Delete ${categoryIds.length} selected categories?`)) return;

        try {
            await this.repository.bulkDeleteCategories(categoryIds);
            this.notificationService.showSuccess(`${categoryIds.length} categories deleted successfully`);

            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Bulk delete error:', error);
            this.notificationService.showError('Failed to delete selected categories');
        }
    }

    async bulkActivateCategories(categoryIds) {
        if (!confirm(`Activate ${categoryIds.length} selected categories?`)) return;

        try {
            await this.repository.bulkActivateCategories(categoryIds);
            this.notificationService.showSuccess(`${categoryIds.length} categories activated successfully`);
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Bulk activate error:', error);
            this.notificationService.showError('Failed to activate selected categories');
        }
    }

    async bulkDeactivateCategories(categoryIds) {
        if (!confirm(`Deactivate ${categoryIds.length} selected categories?`)) return;

        try {
            await this.repository.bulkDeactivateCategories(categoryIds);
            this.notificationService.showSuccess(`${categoryIds.length} categories deactivated successfully`);
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Bulk deactivate error:', error);
            this.notificationService.showError('Failed to deactivate selected categories');
        }
    }

    // Export categories to CSV
    async exportCategories() {
        try {
            this.showLoading(true);

            // Get all categories
            const response = await this.repository.getCategories({
                per_page: 1000,
                show_all: 'true'
            });

            const categories = response.categories;

            // Create CSV content
            const headers = ['ID', 'Title', 'Require Date', 'Multi Select', 'Status', 'Created'];
            const csvContent = [
                headers.join(','),
                ...categories.map(cat => [
                    cat.id,
                    `"${cat.title}"`,
                    cat.is_date_required ? 'Yes' : 'No',
                    cat.is_multi_select_required ? 'Yes' : 'No',
                    cat.is_active ? 'Active' : 'Inactive',
                    new Date(cat.created_at).toLocaleDateString()
                ].join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `donation_categories_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.notificationService.showSuccess(`Categories exported successfully`);

        } catch (error) {
            console.error('Export error:', error);
            this.notificationService.showError('Failed to export categories');
        } finally {
            this.showLoading(false);
        }
    }

    // Get category statistics
    async getCategoryStats() {
        try {
            const response = await this.repository.getCategories({
                per_page: 1000,
                show_all: 'true'
            });

            const categories = response.categories;

            const stats = {
                total: categories.length,
                active: categories.filter(cat => cat.is_active).length,
                inactive: categories.filter(cat => !cat.is_active).length,
                withDateRequired: categories.filter(cat => cat.is_date_required).length,
                withMultiSelect: categories.filter(cat => cat.is_multi_select_required).length
            };

            return stats;
        } catch (error) {
            this.notificationService.showError('Failed to get category stats');
            console.error('Failed to get category stats:', error);
            return null;
        }
    }
}