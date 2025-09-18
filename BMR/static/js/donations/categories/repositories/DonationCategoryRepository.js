// static/js/donations/categories/repositories/DonationCategoryRepository.js
import { BaseRepository } from '../../../shared/repositories/BaseRepository.js';
import { DONATIONS } from '../../../shared/config/apiConfig.js';

export class DonationCategoryRepository extends BaseRepository {
    constructor() {
        super(DONATIONS.CATEGORIES);
    }

    // Custom method names for your domain
    async getCategories(params = {}) {
        const result = await this.getList(params);
        console.log('CategoryRepository: Get categories completed');
        return {
            categories: result.items,
            pagination: result.pagination
        };
    }

    async getCategory(categoryId) {
        console.log(`CategoryRepository: Getting category ${categoryId}`);
        return this.getItem(categoryId);
    }

    async createCategory(categoryData) {
        console.log('CategoryRepository: Creating category', categoryData);

        // Validate required fields
        if (!categoryData.title || categoryData.title.trim() === '') {
            throw new Error('Category title is required');
        }

        // Prepare data for API (matching your serializer fields)
        const payload = {
            title: categoryData.title.trim(),
            is_date_required: Boolean(categoryData.is_date_required),
            is_multi_select_required: Boolean(categoryData.is_multi_select_required)
            // is_active is handled by the model default (True)
        };

        try {
            const result = await this.createItem(payload);
            console.log('CategoryRepository: Category created successfully', result);
            return result;
        } catch (error) {
            console.error('CategoryRepository: Create category failed', error);
            throw this.handleApiError(error);
        }
    }

    async updateCategory(categoryId, categoryData) {
        console.log(`CategoryRepository: Updating category ${categoryId}`, categoryData);

        if (!categoryId) {
            throw new Error('Category ID is required for update');
        }

        // Prepare data for API (only include fields that can be updated)
        const payload = {};

        if (categoryData.title !== undefined) {
            payload.title = categoryData.title.trim();
        }
        if (categoryData.is_date_required !== undefined) {
            payload.is_date_required = Boolean(categoryData.is_date_required);
        }
        if (categoryData.is_multi_select_required !== undefined) {
            payload.is_multi_select_required = Boolean(categoryData.is_multi_select_required);
        }
        if (categoryData.is_active !== undefined) {
            payload.is_active = Boolean(categoryData.is_active);
        }

        try {
            const result = await this.updateItem(categoryId, payload);
            console.log('CategoryRepository: Category updated successfully', result);
            return result;
        } catch (error) {
            console.error('CategoryRepository: Update category failed', error);
            throw this.handleApiError(error);
        }
    }

    async deleteCategory(categoryId) {
        console.log(`CategoryRepository: Deleting category ${categoryId}`);

        if (!categoryId) {
            throw new Error('Category ID is required for deletion');
        }

        try {
            // Your API soft deletes by setting is_active=False
            const result = await this.deleteItem(categoryId);
            console.log('CategoryRepository: Category deleted (deactivated) successfully');
            return result;
        } catch (error) {
            console.error('CategoryRepository: Delete category failed', error);
            throw this.handleApiError(error);
        }
    }

    // Bulk operations using the inherited method
    async bulkDeleteCategories(categoryIds) {
        console.log('CategoryRepository: Bulk deleting categories', categoryIds);

        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            throw new Error('Category IDs array is required for bulk delete');
        }

        try {
            const result = await this.bulkOperation('delete', categoryIds);
            console.log('CategoryRepository: Bulk delete completed successfully');
            return result;
        } catch (error) {
            console.error('CategoryRepository: Bulk delete failed', error);
            throw this.handleApiError(error);
        }
    }

    async bulkActivateCategories(categoryIds) {
        console.log('CategoryRepository: Bulk activating categories', categoryIds);
        return this.bulkOperation('activate', categoryIds);
    }

    async bulkDeactivateCategories(categoryIds) {
        console.log('CategoryRepository: Bulk deactivating categories', categoryIds);
        return this.bulkOperation('deactivate', categoryIds);
    }

    // Toggle category status
    async toggleCategoryStatus(categoryId, newStatus) {
        console.log(`CategoryRepository: Toggling category ${categoryId} status to ${newStatus}`);

        return this.updateCategory(categoryId, {
            is_active: Boolean(newStatus)
        });
    }

    // Handle API errors with proper formatting for your custom_api_response format
    handleApiError(error) {
        console.error('CategoryRepository: API Error', error);

        // If it's already a structured error from BaseRepository, return it
        if (error.isApiError) {
            return error;
        }

        // Handle network errors
        if (!error.response && error.message) {
            return {
                message: 'Network error. Please check your connection and try again.',
                errors: {},
                isApiError: true
            };
        }

        // Handle HTTP errors with your custom_api_response format
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            // Your API returns: { success: false, message: "...", errors: {...} }
            return {
                message: data?.message || `HTTP ${status} error occurred`,
                errors: data?.errors || {},
                success: data?.success || false,
                status: status,
                isApiError: true
            };
        }

        // Fallback for unknown errors
        return {
            message: error.message || 'An unexpected error occurred',
            errors: {},
            isApiError: true
        };
    }

    // Get categories for dropdown/select components (active only)
    async getCategoriesForSelect() {
        try {
            const response = await this.getCategories({
                per_page: 1000, // Get all active categories
                ordering: 'title', // Order by title
                show_all: 'false' // Only active categories
            });

            return response.categories.map(category => ({
                id: category.id,
                title: category.title,
                is_active: category.is_active
            }));
        } catch (error) {
            console.error('Failed to get categories for select:', error);
            throw error;
        }
    }

    // Validate category data before sending to API
    validateCategoryData(categoryData) {
        const errors = {};

        // Title validation
        if (!categoryData.title || categoryData.title.trim() === '') {
            errors.title = 'Category title is required';
        } else if (categoryData.title.trim().length < 2) {
            errors.title = 'Category title must be at least 2 characters';
        } else if (categoryData.title.trim().length > 250) {
            errors.title = 'Category title must not exceed 250 characters';
        }

        // Pattern validation for title (based on your model field)
        const titlePattern = /^[a-zA-Z0-9\s\-_&().]+$/;
        if (categoryData.title && !titlePattern.test(categoryData.title.trim())) {
            errors.title = 'Category title contains invalid characters';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}