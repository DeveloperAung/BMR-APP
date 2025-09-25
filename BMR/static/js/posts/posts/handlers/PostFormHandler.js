import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { PostManager } from '../managers/PostManager.js';

export class PostFormHandler {
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
        this.manager = new PostManager({
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
            post_category: formData.get('category'),
            parent: formData.get('parent_post'),
            title: formData.get('title'),
            short_description: formData.get('short_description'),
            description: formData.get('description'),
            is_published: formData.get('is_published'),
            is_active: formData.get('is_active') === 'on',
        };

        if (this.form.dataset.categoryId) {
            // Only include in edit mode if checkbox is present
            if (formData.has('is_active')) {
                data.is_active = formData.get('is_active') === 'on';
            }
        }
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
            const postId = this.form.dataset.postId; // ✅ use this for update

            if (postId) {
                await this.manager.updatePost(postId, data);
                this.notificationService.showSuccess('Post updated successfully!');
            } else {
                await this.manager.createPost(data);
                this.notificationService.showSuccess('Post created successfully!');
            }

            // redirect after success
            setTimeout(() => {
                window.location.href = '/posts/i/posts/';
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
