import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { SubCategoryManager } from '../managers/SubCategoryManager.js';

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
        this.manager = new SubCategoryManager({
            authService,
            notificationService
        });

        this.bindEvents();
        this.initializeForm();
    }

    /** Initialize form elements and event listeners */
    initializeForm() {
        // Add any subcategory-specific initialization here
        this.bindEvents();
    }

    /** Bind form submit and other event listeners */
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    /** Get form data as an object */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {
            title: formData.get('title'),
            donation_category: formData.get('category'),  // Changed back to 'category' to match backend expectations
            description: formData.get('description') || '',
            is_active: formData.get('is_active') === 'on',
        };

        return data;
    }

    /** Handle form submission */
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
            const subcategoryId = this.form.dataset.subcategoryId;            
            if (subcategoryId) {                
                await this.manager.updateSubCategory(subcategoryId, data);
                this.notificationService.showSuccess('Subcategory updated successfully!');
            } else {
                console.log('create call')
                await this.manager.createSubCategory(data);
                this.notificationService.showSuccess('Subcategory created successfully!');
            }

            // Redirect after success
            setTimeout(() => {
                window.location.href = '/donations/i/subcategories/';
            }, 1500);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService, { form: this.form });
        }
    }

    /** Clear form validation errors */
    clearFieldErrors() {
        this.form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        this.form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    }
}
