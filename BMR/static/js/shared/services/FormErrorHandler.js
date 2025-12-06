export class FormErrorHandler {
    /**
     * Display validation errors on form fields
     * @param {HTMLFormElement} form - The form element
     * @param {Object} errors - Error object from API
     */
    static showErrors(form, errors = {}) {
        if (typeof errors !== 'object') return;

        Object.entries(errors).forEach(([field, messages]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (!input) return;

            input.classList.add('is-invalid');

            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback d-block';
            errorDiv.textContent = Array.isArray(messages) ? messages.join(' ') : String(messages);

            this.clearFieldError(input);
            input.after(errorDiv);
        });
    }

    /**
     * Clear validation errors for a single field
     * @param {HTMLElement} input
     */
    static clearFieldError(input) {
        const next = input?.nextElementSibling;
        if (next && next.classList.contains('invalid-feedback')) {
            next.remove();
        }
        input.classList.remove('is-invalid');
    }

    /**
     * Format error data into a user-friendly message
     */
    static formatErrors(errorData) {
        if (!errorData) return 'Validation failed.';

        if (typeof errorData === 'string') return errorData;

        if (Array.isArray(errorData)) return errorData.map(String).join('<br>');

        if (typeof errorData === 'object') {
            if (errorData.detail) return this.formatErrors(errorData.detail);
            if (errorData.non_field_errors) return this.formatErrors(errorData.non_field_errors);

            return Object.entries(errorData)
                .map(([field, msgs]) => {
                    const label = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return Array.isArray(msgs)
                        ? msgs.map(msg => `<strong>${label}:</strong> ${msg}`).join('<br>')
                        : `<strong>${label}:</strong> ${msgs}`;
                }).join('<br>');
        }

        return 'An unknown error occurred.';
    }
}
