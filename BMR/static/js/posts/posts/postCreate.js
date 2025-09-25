import { ApiErrorHandler } from '../../shared/services/ApiErrorHandler.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';
import { PostManager } from './managers/PostManager.js';
import { initQuillEditor } from '../../shared/utils/quill-init.js';

export class PostFormHandler {
    constructor(form, { authService, notificationService }) {
        if (!form) throw new Error('Form element is required');

        this.form = form;
        this.authService = authService;
        this.notificationService = notificationService;
        this.manager = new PostManager({ authService, notificationService });

        this.initQuillEditor();
        this.bindEvents();

        this.quill = initQuillEditor({
          editorSelector: '#editor7',
          toolbarSelector: '#toolbar7'
        });
    }

    initQuillEditor() {
        this.quill = new Quill('#editor7', {
            modules: {
                toolbar: {
                    container: '#toolbar7',
                    handlers: {
                        image: () => this.selectLocalImage()
                    }
                }
            },
            theme: 'snow',
            placeholder: 'Enter description...'
        });
    }

    selectLocalImage() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const range = this.quill.getSelection(true);
                    this.quill.insertEmbed(range.index, 'image', e.target.result);
                    // Move cursor after image
                    this.quill.setSelection(range.index + 1);
                };
                reader.readAsDataURL(file);
            }
        };
    }

    bindEvents() {
        this.form.addEventListener('submit', e => this.handleSubmit(e));

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

    getFormData() {
        // Copy Quill HTML into hidden input before creating FormData
        this.form.querySelector('#description').value = this.quill.root.innerHTML;
        return new FormData(this.form);
    }

    async handleSubmit(event) {
        event.preventDefault();
        this.form.classList.add('was-validated');

        if (!this.form.checkValidity()) {
            this.notificationService.showWarning('Please correct the errors in the form.');
            return;
        }

        try {
            const data = this.getFormData();
            const postId = this.form.dataset.postId;

            if (postId) {
                await this.manager.updatePost(postId, data);
                this.notificationService.showSuccess('Post updated successfully!');
            } else {
                await this.manager.createPost(data);
                this.notificationService.showSuccess('Post created successfully!');
            }

            setTimeout(() => {
                window.location.href = '/posts/';
            }, 1500);
        } catch (error) {
            ApiErrorHandler.handle(error, this.notificationService, { form: this.form });
        }
    }
}

// Auto-init
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('postForm');
        if (form) {
            window.postApp = new PostFormHandler(form, {
                authService: new AuthService(),
                notificationService: new NotificationService()
            });
        }
    });
}
