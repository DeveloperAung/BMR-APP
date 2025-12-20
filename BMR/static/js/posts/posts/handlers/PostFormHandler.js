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
        this.compressedCoverImage = null;
        this.compressedMediaFile = null;

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
            coverInput.addEventListener('change', (e) => this.handleCoverChange(e));
        }

        const mediaInput = this.form.querySelector('#media');
        if (mediaInput) {
            mediaInput.addEventListener('change', (e) => this.handleMediaChange(e));
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

        const coverImage = this.compressedCoverImage || formData.get('cover_image');
        if (!coverImage || !coverImage.name) {
            formData.delete('cover_image');
        } else {
            formData.set('cover_image', coverImage);
        }

        const mediaFile = this.compressedMediaFile || formData.get('media');
        if (!mediaFile || !mediaFile.name) {
            formData.delete('media');
        } else {
            formData.set('media', mediaFile);
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

    async handleCoverChange(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('cover_image_preview');
        this.compressedCoverImage = null;

        if (!file) {
            if (preview) preview.style.display = 'none';
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.notificationService.showWarning('Cover image must be an image file.');
            e.target.value = '';
            if (preview) preview.style.display = 'none';
            return;
        }

        const processed = await this.compressImageIfNeeded(file);
        if (!processed) {
            e.target.value = '';
            if (preview) preview.style.display = 'none';
            return;
        }

        this.compressedCoverImage = processed;
        if (preview) {
            preview.src = await this.readFileAsDataURL(processed);
            preview.style.display = 'block';
        }
    }

    async handleMediaChange(e) {
        const file = e.target.files[0];
        this.compressedMediaFile = null;

        if (!file) {
            return;
        }

        if (file.type.startsWith('image/')) {
            const processed = await this.compressImageIfNeeded(file);
            if (!processed) {
                e.target.value = '';
                return;
            }
            this.compressedMediaFile = processed;
        } else if (file.size > 5 * 1024 * 1024) {
            this.notificationService.showWarning('Media files over 5MB are not allowed.');
            e.target.value = '';
        }
    }

    async compressImageIfNeeded(file) {
        const maxBytes = 5 * 1024 * 1024;
        if (file.size <= maxBytes) {
            return file;
        }

        try {
            const compressed = await this.compressImage(file, { maxSizeMB: 5, maxDimension: 1920 });
            if (compressed.size > maxBytes) {
                this.notificationService.showWarning('Could not compress image under 5MB. Please choose a smaller image.');
                return null;
            }
            return compressed;
        } catch (err) {
            console.error('Image compression failed', err);
            this.notificationService.showWarning('Could not process that image. Please try another file.');
            return null;
        }
    }

    ensureJpegExtension(name) {
        if (/\.jpe?g$/i.test(name)) return name;
        const base = name.replace(/\.[^.]+$/, '') || 'image';
        return `${base}.jpg`;
    }

    getScaledDimensions(img, maxDimension) {
        const { width, height } = img;
        if (width <= maxDimension && height <= maxDimension) {
            return { width, height };
        }
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    canvasToBlob(canvas, type, quality) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), type, quality);
        });
    }

    async compressImage(file, { maxSizeMB = 5, maxDimension = 1920 } = {}) {
        const dataUrl = await this.readFileAsDataURL(file);
        const img = await this.loadImage(dataUrl);
        const { width, height } = this.getScaledDimensions(img, maxDimension);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const targetBytes = maxSizeMB * 1024 * 1024;
        const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3];
        for (const quality of qualities) {
            const blob = await this.canvasToBlob(canvas, 'image/jpeg', quality);
            if (!blob) continue;
            if (blob.size <= targetBytes || quality === qualities[qualities.length - 1]) {
                return new File([blob], this.ensureJpegExtension(file.name), {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });
            }
        }
        return file;
    }
}
