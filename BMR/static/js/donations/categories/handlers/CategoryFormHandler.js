// static/js/donations/categories/handlers/CategoryFormHandler.js - Complete Fixed Version
import { FormValidator } from '../../../shared/utils/FormValidator.js';

export class CategoryFormHandler {
    constructor({ repository, notificationService, mode = 'create', categoryId = null }) {
        this.repository = repository;
        this.notificationService = notificationService;
        this.mode = mode;
        this.categoryId = categoryId;

        this.form = null;
        this.submitButton = null;
        this.cancelButton = null;
        this.validator = new FormValidator();

        this.isSubmitting = false;
    }

    async init() {
        this.cacheElements();
        this.setupValidation();
        this.setupEventListeners();

        if (this.mode === 'edit' && this.categoryId) {
            await this.loadCategoryData();
        }
    }

    cacheElements() {
        this.form = document.getElementById('categoryForm');
        this.submitButton = document.getElementById('submitBtn');
        this.cancelButton = document.getElementById('cancelBtn');

        this.fields = {
            title: document.getElementById('idTitle'),
            isDateRequired: document.getElementById('idIsRequireDate'),
            isMultiSelectRequired: document.getElementById('idIsRequireMultiSelect')
        };

        // Log missing elements for debugging
        if (!this.form) {
            console.error('CategoryFormHandler: Form element with id "categoryForm" not found');
        }

        Object.entries(this.fields).forEach(([key, element]) => {
            if (!element) {
                console.warn(`CategoryFormHandler: Missing field element ${key}`);
            }
        });
    }

    setupValidation() {
        const validationRules = {
            title: {
                required: true,
                minLength: 2,
                maxLength: 250,
                pattern: /^[a-zA-Z0-9\s\-_&().]+$/,
                message: 'Title must be 2-250 characters and contain only letters, numbers, spaces, and basic punctuation'
            }
        };

        this.validator.setRules(validationRules);
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Real-time validation
        if (this.fields.title) {
            this.fields.title.addEventListener('blur', () => {
                this.validateField('title');
            });

            this.fields.title.addEventListener('input', () => {
                this.clearFieldError('title');
            });
        }

        // Cancel button
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', this.handleCancel.bind(this));
        }

        // Prevent double submission
        if (this.submitButton) {
            this.submitButton.addEventListener('click', (e) => {
                if (this.isSubmitting) {
                    e.preventDefault();
                    return false;
                }
            });
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (this.isSubmitting) return;

        // Clear all previous errors first
        this.clearAllErrors();

        try {
            this.setSubmitting(true);

            // Client-side validation
            if (!this.validateForm()) {
                return;
            }

            // Collect form data
            const formData = this.collectFormData();
            console.log('Submitting form data:', formData);

            // Submit data
            let response;
            if (this.mode === 'create') {
                response = await this.createCategoryWithAuth(formData);
                this.notificationService.showSuccess('Category created successfully!');
            } else {
                response = await this.updateCategoryWithAuth(this.categoryId, formData);
                this.notificationService.showSuccess('Category updated successfully!');
            }

            console.log('Success response:', response);

            // Redirect to list page after short delay
            setTimeout(() => {
                this.redirectToList();
            }, 1500);

        } catch (error) {
            console.error('Submit error caught:', error);
            this.handleSubmitError(error);
        } finally {
            this.setSubmitting(false);
        }
    }

    // FIXED ERROR HANDLING
    handleSubmitError(error) {
        console.error('Form submission error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error errors:', error.errors);

        // Handle different error scenarios
        if (error.status === 400 || error.status === 422) {
            // Validation errors from API
            this.handleValidationErrors(error);
        } else if (error.status === 401) {
            // Authentication error
            this.handleAuthenticationError();
        } else if (error.status === 403) {
            // Permission error
            this.notificationService.showError('You do not have permission to perform this action.');
        } else if (error.status === 409) {
            // Conflict error (duplicate title, etc.)
            this.notificationService.showError(error.message || 'A category with this title already exists.');
        } else if (error.status === 'network') {
            // Network error
            this.notificationService.showError('Network error. Please check your connection and try again.');
        } else {
            // General error
            const message = error.message || 'An unexpected error occurred. Please try again.';
            this.notificationService.showError(message);
        }
    }

    handleValidationErrors(error) {
        console.log('Handling validation errors:', error);

        let hasFieldErrors = false;

        // Handle field-specific errors
        if (error.errors && typeof error.errors === 'object') {
            Object.entries(error.errors).forEach(([fieldName, messages]) => {
                hasFieldErrors = true;
                let message;

                console.log(`Processing field error - Field: ${fieldName}, Messages:`, messages);

                // Handle different message formats
                if (Array.isArray(messages)) {
                    message = messages[0]; // Take first error message
                } else if (typeof messages === 'string') {
                    message = messages;
                } else if (typeof messages === 'object' && messages.message) {
                    message = messages.message;
                } else {
                    message = 'Invalid value';
                }

                console.log(`Final message for ${fieldName}:`, message);

                // Map API field names to form field names
                const mappedFieldName = this.mapApiFieldToFormField(fieldName);
                console.log(`Mapped field name: ${fieldName} -> ${mappedFieldName}`);

                this.showFieldError(mappedFieldName, message);
            });
        }

        // Show general error message
        if (!hasFieldErrors) {
            const message = error.message || 'Please check your input and try again.';
            this.notificationService.showError(message);
        } else {
            // Show a general message along with field errors
            this.notificationService.showError('Please correct the errors below and try again.');
        }
    }

    handleAuthenticationError() {
        this.notificationService.showError('Your session has expired. Please login again.');

        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');

        setTimeout(() => {
            window.location.href = '/login/';
        }, 2000);
    }

    mapApiFieldToFormField(apiFieldName) {
        // Map API field names to your form field names
        const fieldMapping = {
            'title': 'title',
            'is_date_required': 'isDateRequired',
            'is_multi_select_required': 'isMultiSelectRequired'
        };

        return fieldMapping[apiFieldName] || apiFieldName;
    }

    // IMPROVED API CALLS WITH BETTER ERROR HANDLING
    async createCategoryWithAuth(categoryData) {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            throw {
                status: 401,
                message: 'No access token found. Please login.',
                errors: {},
                isApiError: true
            };
        }

        const csrfToken = this.getCSRFToken();

        try {
            console.log('Making API call to create category...');

            const response = await fetch('/api/donations/categories/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    title: categoryData.title.trim(),
                    is_date_required: Boolean(categoryData.is_date_required),
                    is_multi_select_required: Boolean(categoryData.is_multi_select_required)
                })
            });

            console.log('API Response status:', response.status);

            const result = await response.json();
            console.log('API Response data:', result);

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: result.message || result.detail || `HTTP ${response.status} Error`,
                    errors: result.errors || {},
                    isApiError: true,
                    response: result
                };
            }

            // Check for your custom success flag
            if (result.success === false) {
                throw {
                    status: response.status,
                    message: result.message || 'Category update failed',
                    errors: result.errors || {},
                    isApiError: true,
                    response: result
                };
            }

            return result;

        } catch (error) {
            console.error('API call error:', error);

            // Handle network errors (fetch failures)
            if (!error.status) {
                throw {
                    status: 'network',
                    message: 'Network error. Please check your connection and try again.',
                    errors: {},
                    isApiError: true
                };
            }

            throw error;
        }
    }

    getCSRFToken() {
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) return metaToken.getAttribute('content');

        const inputToken = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (inputToken) return inputToken.value;

        const value = `; ${document.cookie}`;
        const parts = value.split(`; csrftoken=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }

        return '';
    }

    validateForm() {
        let isValid = true;

        // Validate title
        if (!this.validateField('title')) {
            isValid = false;
        }

        return isValid;
    }

    validateField(fieldName) {
        const field = this.fields[fieldName];
        if (!field) return true;

        const value = field.value.trim();
        const validation = this.validator.validateField(fieldName, value);

        if (!validation.isValid) {
            this.showFieldError(fieldName, validation.message);
            return false;
        }

        this.clearFieldError(fieldName);
        return true;
    }

    collectFormData() {
        return {
            title: this.fields.title?.value.trim() || '',
            is_date_required: this.fields.isDateRequired?.checked || false,
            is_multi_select_required: this.fields.isMultiSelectRequired?.checked || false
        };
    }

    async loadCategoryData() {
        try {
            this.showLoading(true);

            const accessToken = localStorage.getItem('access_token');
            if (!accessToken) {
                throw new Error('No access token found. Please login.');
            }

            const response = await fetch(`/api/donations/categories/${this.categoryId}/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.detail || 'Failed to load category');
            }

            const result = await response.json();
            const category = result.data || result;

            this.populateForm(category);
        } catch (error) {
            console.error('Failed to load category data:', error);
            this.notificationService.showError('Failed to load category data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    populateForm(category) {
        if (this.fields.title) {
            this.fields.title.value = category.title || '';
        }
        if (this.fields.isDateRequired) {
            this.fields.isDateRequired.checked = category.is_date_required || false;
        }
        if (this.fields.isMultiSelectRequired) {
            this.fields.isMultiSelectRequired.checked = category.is_multi_select_required || false;
        }
    }

    // IMPROVED FIELD ERROR DISPLAY
    showFieldError(fieldName, message) {
        const field = this.fields[fieldName];
        if (!field) {
            console.warn(`Field ${fieldName} not found for error display`);
            // Still show notification for unmapped fields
            this.notificationService.showError(`${fieldName}: ${message}`);
            return;
        }

        console.log(`Showing field error for ${fieldName}:`, message);

        // Remove existing error
        this.clearFieldError(fieldName);

        // Add error class to field
        field.classList.add('is-invalid');

        // Create error element with icon and better styling
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback d-block';
        errorDiv.innerHTML = `<i class="fa fa-exclamation-circle me-1"></i>${message}`;
        errorDiv.id = `${fieldName}-error`;

        // Insert error after field or after field's container
        const insertTarget = field.closest('.input-group') || field.parentNode;
        insertTarget.appendChild(errorDiv);

        // Scroll to first error field and focus
        if (document.querySelectorAll('.is-invalid').length === 1) {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => field.focus(), 100);
        }
    }

    clearFieldError(fieldName) {
        const field = this.fields[fieldName];
        if (!field) return;

        field.classList.remove('is-invalid');

        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.remove();
        }
    }

    clearAllErrors() {
        Object.keys(this.fields).forEach(fieldName => {
            this.clearFieldError(fieldName);
        });

        // Also remove any floating errors
        document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    }

    setSubmitting(isSubmitting) {
        this.isSubmitting = isSubmitting;

        if (this.submitButton) {
            this.submitButton.disabled = isSubmitting;
            this.submitButton.innerHTML = isSubmitting
                ? '<span class="spinner-border spinner-border-sm me-2"></span>Saving...'
                : (this.mode === 'create' ? 'Create Category' : 'Update Category');
        }

        // Disable form fields during submission
        Object.values(this.fields).forEach(field => {
            if (field) field.disabled = isSubmitting;
        });
    }

    showLoading(isLoading) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = isLoading ? 'block' : 'none';
        }

        if (isLoading) {
            this.setSubmitting(true);
        }
    }

    handleCancel(event) {
        event.preventDefault();

        // Check if form has changes
        if (this.hasUnsavedChanges()) {
            if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                return;
            }
        }

        this.redirectToList();
    }

    hasUnsavedChanges() {
        // Simple check for any non-empty fields
        const currentData = this.collectFormData();

        if (this.mode === 'create') {
            return currentData.title !== '' ||
                   currentData.is_date_required ||
                   currentData.is_multi_select_required;
        }

        // For edit mode, you might want to compare with original data
        return false;
    }

    redirectToList() {
        window.location.href = '/donations/categories/';
    }

    // Public methods for external use
    reset() {
        if (this.form) {
            this.form.reset();
        }
        this.clearAllErrors();
    }

    getFormData() {
        return this.collectFormData();
    }

    setFieldValue(fieldName, value) {
        const field = this.fields[fieldName];
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = value;
            } else {
                field.value = value;
            }
        }
    }

    // Debug method to test error display
    testErrorDisplay() {
        console.log('Testing error display...');

        // Test field errors
        this.showFieldError('title', 'This is a test error message for title field');

        // Test notification
        this.notificationService.showError('This is a test notification error');

        console.log('Error display test completed');
    }
}
                })
            });

            console.log('API Response status:', response.status);

            const result = await response.json();
            console.log('API Response data:', result);

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: result.message || result.detail || `HTTP ${response.status} Error`,
                    errors: result.errors || {},
                    isApiError: true,
                    response: result
                };
            }

            // Check for your custom success flag
            if (result.success === false) {
                throw {
                    status: response.status,
                    message: result.message || 'Category creation failed',
                    errors: result.errors || {},
                    isApiError: true,
                    response: result
                };
            }

            return result;

        } catch (error) {
            console.error('API call error:', error);

            // Handle network errors (fetch failures)
            if (!error.status) {
                throw {
                    status: 'network',
                    message: 'Network error. Please check your connection and try again.',
                    errors: {},
                    isApiError: true
                };
            }

            throw error;
        }
    }

    async updateCategoryWithAuth(categoryId, categoryData) {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            throw {
                status: 401,
                message: 'No access token found. Please login.',
                errors: {},
                isApiError: true
            };
        }

        const csrfToken = this.getCSRFToken();

        try {
            console.log('Making API call to update category...');

            const response = await fetch(`/api/donations/categories/${categoryId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    title: categoryData.title.trim(),
                    is_date_required: Boolean(categoryData.is_date_required),