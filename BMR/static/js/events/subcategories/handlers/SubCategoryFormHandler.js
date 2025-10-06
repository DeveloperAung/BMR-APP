import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { EventSubCategoryManager } from '../managers/SubCategoryManager.js';

export class SubCategoryFormHandler {
    /**
     * @param {HTMLFormElement} form
     * @param {object} services - { authService, notificationService }
     */
    constructor(form, { authService, notificationService }) {
        if (!form) throw new Error('Form element is required');
        if (!notificationService) throw new Error('NotificationService is required');

        this.form = form;
        this.authService = authService;
        this.notificationService = notificationService;

        // Manager handles API + repository
        this.manager = new EventSubCategoryManager({
            authService,
            notificationService
        });

        this.bindEvents();
    }

    /** Bind form submit listener */
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    /**
     * Get form data as a plain object
     * @returns {object} Form data
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {
            title: formData.get('title'),
            title_others: formData.get('title_others'),
            event_category: formData.get('event_category'),
            is_active: formData.get('is_active') === 'on',
            is_menu: formData.get('is_menu') === 'on',
        };

        if (this.form.dataset.subCategoryId) {
            // Only include in edit mode if checkbox is present
            if (formData.has('is_active')) {
                data.is_active = formData.get('is_active') === 'on';
            }
            if (formData.has('is_menu')) {
                data.is_active = formData.get('is_menu') === 'on';
            }
        }
        return data;
    }

    /**
     * Handle form submission (create or update)
     * @param {Event} event - Form submit event
     */
    async handleSubmit(event) {
        event.preventDefault();
        this.clearFieldErrors();
        if (!this.form.checkValidity()) {
            this.form.classList.add('was-validated');
            this.notificationService.showWarning('Please correct the errors in the form.');
            return;
        }

        try {
            const data = this.getFormData();
            const subCategoryId = this.form.dataset.subcategoryId;
            let result;

            if (subCategoryId) {
                result = await this.manager.updateSubCategory(subCategoryId, data);
                this.notificationService.showSuccess('Subcategory updated successfully!');
            } else {
                result = await this.manager.createSubCategory(data);
                this.notificationService.showSuccess('Subcategory created successfully!');
            }

            setTimeout(() => {
                window.location.href = '/events/i/subcategories/';
            }, 1500);
        } catch (error) {
            console.error('Error saving subcategory:', error);
            this.notificationService.showError(`Failed to save subcategory: ${error}`);
            
            // Handle field-specific errors
            if (error.response && error.response.errors) {
                this.displayFieldErrors(error.response.errors);
            }
        }
    }

    /**
     * Display field-level validation errors
     * @param {object} errors - Object mapping field names to error messages
     */
    displayFieldErrors(errors) {
        Object.entries(errors).forEach(([field, messages]) => {
            const input = this.form.querySelector(`[name="${field}"]`);
            if (input) {
                const feedback = input.closest('.form-group')?.querySelector('.invalid-feedback') ||
                              input.nextElementSibling;
                
                if (feedback) {
                    feedback.textContent = Array.isArray(messages) ? messages.join(' ') : messages;
                    input.classList.add('is-invalid');
                }
            }
        });
        
        this.form.classList.add('was-validated');
    }

    /** Clear all field errors */
    clearFieldErrors() {
        this.form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
    }
}
