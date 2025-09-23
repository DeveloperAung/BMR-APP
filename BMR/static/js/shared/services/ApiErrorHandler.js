// shared/services/ApiErrorHandler.js
export class ApiErrorHandler {
    static format(error) {
        const response = error?.response;
        const payload = response?.data?.error || response?.data || {};

        if (!response) {
            return 'Something went wrong. Please try again.';
        }

        const { status } = response;

        switch (status) {
            case 400:
                return this.formatValidationErrors(payload);
            case 401:
                return 'Session expired. Please log in again.';
            case 403:
                return 'You do not have permission to perform this action.';
            case 404:
                return 'The requested resource was not found.';
            case 409:
                return 'A category with this title already exists.';
            default:
                return `Unexpected error (${status}).`;
        }
    }

    static handle(error, notificationService, { form = null } = {}) {
        const message = this.format(error);

        if (notificationService) {
            notificationService.showError(message);
        }

        if (form) {
            this.setFieldErrors(form, error.response?.data || {});
        }
    }

    static formatValidationErrors(errorData) {
        if (!errorData) return 'Validation failed.';
        if (typeof errorData === 'string') return errorData;
        if (Array.isArray(errorData)) return errorData.join('\n');

        if (typeof errorData === 'object') {
            if (errorData.detail) return this.formatValidationErrors(errorData.detail);
            if (errorData.non_field_errors) return this.formatValidationErrors(errorData.non_field_errors);

            return Object.entries(errorData).map(([field, msgs]) => {
                const name = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return Array.isArray(msgs)
                    ? msgs.map(msg => `${name}: ${msg}`).join('\n')
                    : `${name}: ${msgs}`;
            }).join('\n');
        }

        return 'An error occurred. Please try again.';
    }

    static setFieldErrors(form, errors) {
        if (typeof errors !== 'object') return;

        Object.entries(errors).forEach(([field, messages]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (!input) return;

            input.classList.add('is-invalid');

            const existing = input.nextElementSibling;
            if (existing?.classList.contains('invalid-feedback')) {
                existing.remove();
            }

            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback d-block';
            errorDiv.textContent = Array.isArray(messages) ? messages.join(' ') : String(messages);
            input.after(errorDiv);
        });
    }
}
