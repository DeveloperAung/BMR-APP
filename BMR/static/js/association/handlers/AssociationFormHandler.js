import {ApiErrorHandler} from '../../shared/services/ApiErrorHandler.js';
import {AssociationManager} from '../managers/AssociationManager.js';

export class AssociationFormHandler {

    constructor(form, { authService, notificationService }) {
        if (!form) throw new Error('Form element is required');
        if (!notificationService) throw new Error('NotificationService is required');

        this.form = form;
        this.authService = authService;
        this.notificationService = notificationService;

        this.manager = new AssociationManager({
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

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
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
            const hidden = this.form.querySelector('#content');
            if (hidden) hidden.value = this.quill.root.innerHTML;
        }

        return new FormData(this.form);
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
                await this.manager.updateAssoPost(postId, formData);
                this.notificationService.showSuccess('Post updated successfully!');
            } else {
                await this.manager.createAssoPost(formData);
                this.notificationService.showSuccess('Post created successfully!');
            }

            setTimeout(() => {
                window.location.href = '/association/i/asso_post/list/';
            }, 1500);
        } catch (error) {
            console.error('catch error', error);
            ApiErrorHandler.handle(error, this.notificationService, { form: this.form });
        }
    }
}
