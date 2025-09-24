import { CategoryManager } from './managers/CategoryManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class EventCategoryApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.categoryManager = null;
    }

    async init() {
        try {
            this.categoryManager = new CategoryManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.loadCategories();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing event categories:', error);
            this.notificationService.showError('Failed to initialize event categories. Please refresh the page.');
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="view-category"]')) {
                this.categoryManager.viewCategory(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="edit-category"]')) {
                this.categoryManager.editCategory(e.target.dataset.categoryId);
            } else if (e.target.matches('[data-action="delete-category"]')) {
                this.categoryManager.toggleCategoryStatus(e.target.dataset.categoryId, e.target.dataset.title);
            }
        });
    }

    async loadCategories() {
        try {
            // this.notificationService.showLoading('Loading event categories...');
            const categories = await this.categoryManager.getCategories();
            this.renderCategories(categories);
        } catch (error) {
            console.error('Error loading event categories:', error);
            this.notificationService.showError('Failed to load event categories. Please try again.');
        } finally {
            // this.notificationService.hideLoading();
        }
    }

    renderCategories(categories) {
        const tbody = document.querySelector('#eventCategoriesTable tbody');
        if (!tbody) return;

        if (!categories || categories.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        No event categories found. <a href="/events/i/categories/create/" class="text-primary">Create one</a>.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = categories.map(category => `
            <tr data-category-id="${category.id}">
                <td>${category.title}</td>
                <td class="text-center">
                    <span class="badge ${category.is_active ? 'bg-success' : 'bg-secondary'}">
                        ${category.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${new Date(category.created_at).toLocaleDateString()}</td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <a href="/events/i/categories/${category.id}/edit/" 
                           class="btn btn-outline-primary" 
                           data-action="edit-category" 
                           data-category-id="${category.id}">
                            <i class="bi bi-pencil"></i> Edit
                        </a>
                        <button type="button" 
                                class="btn btn-outline-danger" 
                                data-action="delete-category" 
                                data-category-id="${category.id}"
                                data-category-title="${category.title}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Delete category confirmation
        document.addEventListener('click', async (e) => {
            if (e.target.closest('[data-action="delete-category"]')) {
                const button = e.target.closest('[data-action="delete-category"]');
                const categoryId = button.dataset.categoryId;
                const categoryTitle = button.dataset.categoryTitle;
                
                if (confirm(`Are you sure you want to delete "${categoryTitle}"?`)) {
                    try {
                        await this.categoryManager.deleteCategory(categoryId);
                        this.notificationService.showSuccess('Category deleted successfully');
                        await this.loadCategories();
                    } catch (error) {
                        console.error('Error deleting category:', error);
                        this.notificationService.showError('Failed to delete category');
                    }
                }
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new EventCategoryApp();
    app.init();
});