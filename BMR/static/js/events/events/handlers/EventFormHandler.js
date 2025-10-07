import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { EventManager } from '../managers/EventManager.js';

export class EventFormHandler {
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

        this.manager = new EventManager({
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

    getFormData() {
        if (this.quill && this.quill.root) {
            const hidden = this.form.querySelector('#description');
            if (hidden) hidden.value = this.quill.root.innerHTML;
        }

        const formData = new FormData(this.form);

        const switches = ['is_published', 'is_active', 'set_banner', 'is_registered', 'is_short_course'];
        switches.forEach(name => {
            const field = this.form.querySelector(`[name="${name}"]`);
            formData.set(name, field?.checked ? 'true' : 'false');
        });

        // Debug: To check contain entries
        // for (const [key, value] of formData.entries()) {
        //     console.log(`${key}:`, value);
        // }

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

            const eventId = this.form.dataset.eventId; // for update

            if (eventId) {
                await this.manager.updateEvent(eventId, formData);
                this.notificationService.showSuccess('Event updated successfully!');
            } else {
                await this.manager.createEvent(formData);
                this.notificationService.showSuccess('Event created successfully!');
            }

            setTimeout(() => {
                window.location.href = '/events/i/list/';
            }, 1500);
        } catch (error) {
            console.error('catch error', error);
            ApiErrorHandler.handle(error, this.notificationService, { form: this.form });
        }
    }
}
