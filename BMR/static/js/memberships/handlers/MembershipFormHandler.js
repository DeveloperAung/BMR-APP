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
    }

    initializeImagePreview() {
        const fileInput = this.form.querySelector('#profile_picture');
        const preview = this.form.querySelector('#profile_picture_preview');
        
        if (fileInput && preview) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 2 * 1024 * 1024) { // 2MB limit
                        this.notificationService.showWarning('Profile picture must be less than 2MB');
                        fileInput.value = '';
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        preview.src = event.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    initializePhoneInputs() {
        // Initialize intl-tel-input for phone fields if library is available
        if (typeof window.intlTelInput !== 'undefined') {
            const phoneInputs = this.form.querySelectorAll('input[type="tel"]');
            phoneInputs.forEach(input => {
                window.intlTelInput(input, {
                    preferredCountries: ['sg', 'my', 'id'],
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
                nric_fin: formData.get('nric_fin'),
                primary_contact: formData.get('mobile'),
                secondary_contact: formData.get('secondary_contact') || '',
                residential_status: formData.get('residential_status'),
                postal_code: formData.get('postal_code'),
                address: formData.get('address')
            },
            membership_type: parseInt(formData.get('membership_type'))
        };

        // Handle profile picture separately if present
        const profilePicture = formData.get('profile_picture');
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
        }
    }

    async submitPage1(data) {
        this.notificationService.showInfo('Submitting profile information...');
        
        const response = await this.manager.submitPage1(data);
        
        this.notificationService.showSuccess('Profile information saved successfully!');
        
        // Redirect to page 2 after short delay
        setTimeout(() => {
            window.location.href = '/memberships/registration/step-2/';
        }, 1500);
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
        }, 1500);
    }

    /** Clear inline field errors */
    clearFieldErrors() {
        this.form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        this.form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    }
}