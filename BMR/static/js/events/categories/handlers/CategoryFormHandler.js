// static/js/events/categories/handlers/CategoryFormHandler.js
import { ApiErrorHandler } from '../../../../shared/services/ApiErrorHandler.js';
import { CategoryManager } from '../managers/CategoryManager.js';

export class CategoryFormHandler {
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
        this.manager = new CategoryManager({
            authService,
            notificationService
        });

        this.bindEvents();
    }

    /** Bind form submit listener */
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {
            title: formData.get('title'),
            is_active: formData.get('is_active') === 'on',
        };
        return data;
    }

    /** Handle form submit (create or update) */
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
            const categoryId = this.form.dataset.categoryId; // For update

            if (categoryId) {
                await this.manager.updateCategory(categoryId, data);
                this.notificationService.showSuccess('Event category updated successfully!');
            } else {
                await this.manager.createCategory(data);
                this.notificationService.showSuccess('Event category created successfully!');
            }

            // redirect after success
            setTimeout(() => {
                window.location.href = '/events/i/categories/';
            }, 1500);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService, { form: this.form });
        }
    }

    /** Clear inline field errors */
    clearFieldErrors() {
        this.form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        this.form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    }
}
