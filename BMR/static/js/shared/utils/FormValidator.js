// static/js/shared/utils/FormValidator.js
export class FormValidator {
    constructor() {
        this.rules = {};
    }

    setRules(rules) {
        this.rules = rules;
    }

    validateField(fieldName, value) {
        const rule = this.rules[fieldName];
        if (!rule) {
            return { isValid: true };
        }

        // Required validation
        if (rule.required && (!value || value.trim() === '')) {
            return {
                isValid: false,
                message: rule.message || `${this.capitalizeFirst(fieldName)} is required`
            };
        }

        // Skip other validations if field is empty and not required
        if (!value || value.trim() === '') {
            return { isValid: true };
        }

        // Min length validation
        if (rule.minLength && value.length < rule.minLength) {
            return {
                isValid: false,
                message: rule.message || `${this.capitalizeFirst(fieldName)} must be at least ${rule.minLength} characters`
            };
        }

        // Max length validation
        if (rule.maxLength && value.length > rule.maxLength) {
            return {
                isValid: false,
                message: rule.message || `${this.capitalizeFirst(fieldName)} must not exceed ${rule.maxLength} characters`
            };
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
            return {
                isValid: false,
                message: rule.message || `${this.capitalizeFirst(fieldName)} format is invalid`
            };
        }

        // Custom validation function
        if (rule.custom && typeof rule.custom === 'function') {
            const customResult = rule.custom(value);
            if (!customResult.isValid) {
                return customResult;
            }
        }

        return { isValid: true };
    }

    validateForm(formData) {
        const errors = {};
        let isValid = true;

        Object.entries(formData).forEach(([fieldName, value]) => {
            const validation = this.validateField(fieldName, value);
            if (!validation.isValid) {
                errors[fieldName] = validation.message;
                isValid = false;
            }
        });

        return {
            isValid,
            errors
        };
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Common validation patterns
    static patterns = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[\+]?[1-9][\d]{0,15}$/,
        alphanumeric: /^[a-zA-Z0-9]+$/,
        alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
        title: /^[a-zA-Z0-9\s\-_&().]+$/,
        url: /^https?:\/\/.+/,
        number: /^\d+$/,
        decimal: /^\d+\.?\d*$/
    };

    // Common validation rules generators
    static createRequiredRule(message = null) {
        return {
            required: true,
            message: message
        };
    }

    static createLengthRule(min, max, message = null) {
        return {
            minLength: min,
            maxLength: max,
            message: message
        };
    }

    static createPatternRule(pattern, message = null) {
        return {
            pattern: pattern,
            message: message
        };
    }

    static createEmailRule(message = 'Please enter a valid email address') {
        return {
            pattern: FormValidator.patterns.email,
            message: message
        };
    }

    static createTitleRule(message = 'Title must contain only letters, numbers, spaces, and basic punctuation') {
        return {
            required: true,
            minLength: 2,
            maxLength: 200,
            pattern: FormValidator.patterns.title,
            message: message
        };
    }
}