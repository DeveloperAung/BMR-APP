// static/js/donations/categories/managers/CategoryManager.js
import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { DonationCategoryRepository } from '../repositories/DonationCategoryRepository.js';
import { CategoryTableRenderer } from '../renderers/CategoryTableRenderer.js';
import { CategoryFilterHandler } from '../handlers/CategoryFilterHandler.js';

export class CategoryManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new DonationCategoryRepository();
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

        // Initialize filter handler with callback
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

    // Category-specific methods
    async viewCategory(categoryId) {
        console.log(`Viewing category ${categoryId}`);
        // Implement specific view logic - could open modal or navigate to detail page
        window.location.href = `/donations/categories/${categoryId}/`;
    }

    async editCategory(categoryId) {
        console.log(`Editing category ${categoryId}`);
        // Navigate to edit page
        window.location.href = `/donations/categories/${categoryId}/edit/`;
    }

    async deleteCategory(categoryId, title) {
        await this.deleteItem(categoryId, title, `Delete category "${title}"?`);
    }

    // Additional category-specific methods
    async toggleCategoryStatus(categoryId, currentStatus) {
        try {
            const newStatus = !currentStatus;
            await this.repository.toggleCategoryStatus(categoryId, newStatus);
            this.showNotification(`Category status updated successfully`, 'success');
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Toggle status error:', error);
            this.showNotification('Failed to update category status', 'error');
        }
    }

    async bulkDeleteCategories(categoryIds) {
        if (!confirm(`Delete ${categoryIds.length} selected categories?`)) return;

        try {
            await this.repository.bulkDeleteCategories(categoryIds);
            this.showNotification(`${categoryIds.length} categories deleted successfully`, 'success');
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Bulk delete error:', error);
            this.showNotification('Failed to delete selected categories', 'error');
        }
    }

    async bulkActivateCategories(categoryIds) {
        if (!confirm(`Activate ${categoryIds.length} selected categories?`)) return;

        try {
            await this.repository.bulkActivateCategories(categoryIds);
            this.showNotification(`${categoryIds.length} categories activated successfully`, 'success');
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Bulk activate error:', error);
            this.showNotification('Failed to activate selected categories', 'error');
        }
    }

    async bulkDeactivateCategories(categoryIds) {
        if (!confirm(`Deactivate ${categoryIds.length} selected categories?`)) return;

        try {
            await this.repository.bulkDeactivateCategories(categoryIds);
            this.showNotification(`${categoryIds.length} categories deactivated successfully`, 'success');
            await this.loadItems(this.state.currentPage);
        } catch (error) {
            console.error('Bulk deactivate error:', error);
            this.showNotification('Failed to deactivate selected categories', 'error');
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

            this.showNotification('Categories exported successfully', 'success');

        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Failed to export categories', 'error');
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
            console.error('Failed to get category stats:', error);
            return null;
        }
    }
}