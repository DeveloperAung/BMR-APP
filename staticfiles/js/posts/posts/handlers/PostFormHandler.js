// static/js/posts/posts/PostFormHandler.js
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

        this.manager = new PostManager({
            authService,
            notificationService
        });

        if (typeof editor7 !== 'undefined') {
          this.quill = editor7;
        } else if (window.editor7) {
          this.quill = window.editor7;
        } else {
          this.quill = null;
        }

        this.bindEvents();
    }

    /** Bind form submit listener + image preview */
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        const coverInput = this.form.querySelector('#cover_image');
        if (coverInput) {
            coverInput.addEventListener('change', e => {
                const file = e.target.files[0];
                const preview = document.getElementById('cover_image_preview');
                if (file) {
                    preview.src = URL.createObjectURL(file);
                    preview.style.display = 'block';
                } else {
                    preview.style.display = 'none';
                }
            });
        }
    }

    /** Clear inline field errors */
    clearFieldErrors() {
        this.form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        this.form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    }

    /** Build FormData with Quill content included */
    getFormData() {
        if (this.quill && this.quill.root) {
            const hidden = this.form.querySelector('#description');
            if (hidden) hidden.value = this.quill.root.innerHTML;
        }

        const formData = new FormData(this.form);

        const coverImage = formData.get('cover_image');
        if (!coverImage || !coverImage.name) {
            formData.delete('cover_image');
        }

        const mediaFile = formData.get('media');
        if (!mediaFile || !mediaFile.name) {
            formData.delete('media');
        }

        // Always return FormData, never JSON
        return formData;
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
            const formData = this.getFormData();
            const postId = this.form.dataset.postId; // for update

            if (postId) {
                await this.manager.updatePost(postId, formData);
                this.notificationService.showSuccess('Post updated successfully!');
            } else {
                await this.manager.createPost(formData);
                this.notificationService.showSuccess('Post created successfully!');
            }

            setTimeout(() => {
                window.location.href = '/posts/i/posts/';
            }, 1500);
        } catch (error) {
            console.error('catch error', error);
            ApiErrorHandler.handle(error, this.notificationService, { form: this.form });
        }
    }
}
