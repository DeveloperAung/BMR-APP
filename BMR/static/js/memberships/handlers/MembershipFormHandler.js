// static/js/memberships/handlers/MembershipFormHandler.js
import { ApiErrorHandler } from '../../shared/services/ApiErrorHandler.js';
import { MembershipManager } from '../managers/MembershipManager.js';

export class MembershipFormHandler {
    /**
     * @param {HTMLFormElement} form
     * @param {object} services - { authService, notificationService }
     * @param {number} pageNumber - 1 or 2
     */
    constructor(form, { authService, notificationService }, pageNumber = 1) {
        if (!form) throw new Error('Form element is required');
        if (!notificationService) throw new Error('NotificationService is required');

        this.form = form;
        this.authService = authService;
        this.notificationService = notificationService;
        this.pageNumber = pageNumber;
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.compressedProfilePicture = null;

        // Manager handles API + repository
        this.manager = new MembershipManager({
            authService,
            notificationService
        });

        this.bindEvents();
        this.initializeImagePreview();
    }

    /** Bind form submit listener */
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add phone input formatting if intl-tel-input is available
        this.initializePhoneInputs();

        // Add input listeners to clear masked state when user types
        this.addInputListeners();
    }

    addInputListeners() {
        const maskedFields = ['nric_fin', 'mobile', 'secondary_contact'];

        maskedFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', (e) => {
                    // If user is typing, clear the masked state
                    if (field.hasAttribute('data-is-masked') && field.getAttribute('data-is-masked') === 'true') {
                        // User is modifying masked value, assume they want to enter new value
                        field.removeAttribute('data-full-value');
                        field.removeAttribute('data-masked-value');
                        field.setAttribute('data-is-masked', 'false');

                        // Update toggle button icon
                        const toggleBtn = field.parentElement.querySelector('.toggle-visibility');
                        if (toggleBtn) {
                            toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
                        }
                    }
                });
            }
        });
    }

    initializeImagePreview() {
        const fileInput = this.form.querySelector('#profile_picture');
        const preview = this.form.querySelector('#profile_picture_preview');

        if (fileInput && preview) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                this.compressedProfilePicture = null;

                if (!file) {
                    preview.style.display = 'none';
                    return;
                }

                try {
                    const compressed = await this.compressImage(file, { maxSizeMB: 5, maxDimension: 1600 });
                    const finalFile = compressed || file;

                    if (finalFile.size > 5 * 1024 * 1024) {
                        this.notificationService.showWarning('Profile picture is too large even after compression (must be under 5MB).');
                        fileInput.value = '';
                        preview.style.display = 'none';
                        return;
                    }

                    this.compressedProfilePicture = finalFile;

                    const dataUrl = await this.readFileAsDataURL(finalFile);
                    preview.src = dataUrl;
                    preview.style.display = 'block';
                } catch (err) {
                    console.error('Failed to prepare profile picture:', err);
                    this.notificationService.showWarning('Could not process that image. Please try a different file.');
                    fileInput.value = '';
                    preview.style.display = 'none';
                }
            });
        }
    }

    ensureJpegExtension(name) {
        if (/\.jpe?g$/i.test(name)) return name;
        const base = name.replace(/\.[^.]+$/, '') || 'profile';
        return `${base}.jpg`;
    }

    getScaledDimensions(img, maxDimension) {
        const width = img.width;
        const height = img.height;
        if (width <= maxDimension && height <= maxDimension) return { width, height };
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        return {
            width: Math.round(width * ratio),
            height: Math.round(height * ratio)
        };
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

    async compressImage(file, { maxSizeMB = 5, maxDimension = 1600 } = {}) {
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

    initializePhoneInputs() {
        // Initialize intl-tel-input for phone fields if library is available
        if (typeof window.intlTelInput !== 'undefined') {
            const phoneInputs = this.form.querySelectorAll('input[type="tel"]');
            phoneInputs.forEach(input => {
                window.intlTelInput(input, {
                    preferredCountries: ['sg', 'mm'],
                    separateDialCode: true,
                    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js"
                });
            });
        }
    }

    getFormData() {
        const formData = new FormData(this.form);

        if (this.pageNumber === 1) {
            return this.getPage1Data(formData);
        } else if (this.pageNumber === 2) {
            return this.getPage2Data(formData);
        }
    }

    getPage1Data(formData) {

        // Get actual values for encrypted fields (unmasked)
        const getNRICValue = () => {
            const field = document.getElementById('nric_fin');
            const fullValue = field?.getAttribute('data-full-value');
            const currentValue = formData.get('nric_fin');
            const isMasked = field?.getAttribute('data-is-masked') === 'true';

            // If field is still masked and have full value, use it
            if (isMasked && fullValue && currentValue && currentValue.includes('*')) {
                return fullValue;
            }

            return currentValue;
        };

        const getMobileValue = () => {
            const field = document.getElementById('mobile');
            const fullValue = field?.getAttribute('data-full-value');
            const currentValue = formData.get('mobile');
            const isMasked = field?.getAttribute('data-is-masked') === 'true';

            if (isMasked && fullValue && currentValue && currentValue.includes('*')) {
                return fullValue;
            }
            return currentValue;
        };

        const getSecondaryContactValue = () => {
            const field = document.getElementById('secondary_contact');
            const fullValue = field?.getAttribute('data-full-value');
            const currentValue = formData.get('secondary_contact');
            const isMasked = field?.getAttribute('data-is-masked') === 'true';

            if (isMasked && fullValue && currentValue && currentValue.includes('*')) {
                return fullValue;
            }
            return currentValue || '';
        };

        const data = {
            profile_info: {
                full_name: formData.get('name'),
                date_of_birth: formData.get('date_of_birth'),
                gender: formData.get('gender'),
                country_of_birth: formData.get('country_of_birth'),
                city_of_birth: formData.get('city_of_birth') || '',
                citizenship: formData.get('citizenship')
            },
            contact_info: {
                nric_fin: getNRICValue(),
                primary_contact: getMobileValue(),
                secondary_contact: getSecondaryContactValue(),
                residential_status: formData.get('residential_status'),
                postal_code: formData.get('postal_code'),
                address: formData.get('address')
            },
            membership_type: parseInt(formData.get('membership_type'))
        };

        // Handle profile picture separately if present
        const profilePicture = this.compressedProfilePicture || formData.get('profile_picture');
        if (profilePicture && profilePicture.size > 0) {
            // need to use FormData for multipart upload
            return {
                useFormData: true,
                data: data,
                file: profilePicture
            };
        }

        return {
            useFormData: false,
            data: data
        };
    }

    getPage2Data(formData) {
        return {
            education_info: {
                education: parseInt(formData.get('education')),
                institution: parseInt(formData.get('institution')),
                other_societies: formData.get('other_societies') || ''
            },
            work_info: {
                occupation: formData.get('occupation'),
                company_name: formData.get('company_name'),
                company_address: formData.get('company_address'),
                company_postal_code: formData.get('company_postal_code'),
                company_contact: formData.get('company_contact') || ''
            }
        };
    }

    /** Handle form submit */
    async handleSubmit(event) {
        event.preventDefault();
        this.clearFieldErrors();

        if (!this.form.checkValidity()) {
            this.form.classList.add('was-validated');
            this.notificationService.showWarning('Please correct the errors in the form.');
            return;
        }
        this.setSubmitting(true);

        try {
            const data = this.getFormData();
            
            if (this.pageNumber === 1) {
                await this.submitPage1(data);
            } else if (this.pageNumber === 2) {
                await this.submitPage2(data);
            }

        } catch (error) {
            console.error('Form submission error:', error);
            ApiErrorHandler.handle(error, this.notificationService, { form: this.form });
        } finally {
            this.setSubmitting(false);
        }
    }

    async submitPage1(data) {
        
        this.notificationService.showLoading('Submitting application...');
        
        const response = await this.manager.submitPage1(data);
        
        this.notificationService.showSuccess('Profile information saved successfully!');

        setTimeout(() => {
            window.location.href = '/memberships/registration/step-2/';
        }, 1000);
    }

    async submitPage2(data) {
        this.notificationService.showInfo('Submitting application...');
        
        const response = await this.manager.submitPage2(data);
        
        // Show success with payment info
        if (response.payment && response.qr_code_url) {
            this.notificationService.showSuccess(
                'Application submitted! Please complete payment using the QR code.'
            );
        } else {
            this.notificationService.showSuccess('Application submitted successfully!');
        }
        
        // Redirect to payment page
        setTimeout(() => {
            window.location.href = '/memberships/registration/step-3/';
        }, 1000);
    }

    /** Clear inline field errors */
    clearFieldErrors() {
        this.form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        this.form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    }

    setSubmitting(isSubmitting) {
        if (this.submitButton) {
            this.submitButton.disabled = isSubmitting;
            let spinner = this.submitButton.querySelector('.spinner-border');
            // Create a spinner if the template doesn't include one
            if (!spinner) {
                spinner = document.createElement('span');
                spinner.className = 'spinner-border spinner-border-sm me-2';
                spinner.setAttribute('role', 'status');
                spinner.setAttribute('aria-hidden', 'true');
                spinner.style.display = 'none';
                this.submitButton.prepend(spinner);
            }
            if (spinner) {
                spinner.style.display = isSubmitting ? 'inline-block' : 'none';
            }
        }
    }
}
