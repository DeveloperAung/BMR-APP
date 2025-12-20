import { convertToISODate } from './convertToISODate.js';

export function setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (!field) {
        console.warn(`Field not found: ${fieldId}`);
        return;
    }

    if (value !== null && value !== undefined && value !== '') {
        // If field is date, normalize
        if (field.type === 'date') {
            value = convertToISODate(value);
        }

        field.value = value;

        // Trigger "change" event so listeners update
        field.dispatchEvent(new Event('change', { bubbles: true }));

        console.log(`Set ${fieldId} =`, value);
    } else {
        console.log(`Skipping ${fieldId} - empty value`);
    }
}


export function setMaskedFieldValue(fieldId, maskedValue, fullValue) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Set the masked value for display
    if (maskedValue) {
        field.value = maskedValue;
    }

    // Store the full value in a data attribute
    if (fullValue) {
        field.setAttribute('data-full-value', fullValue);
        field.setAttribute('data-masked-value', maskedValue);
        field.setAttribute('data-is-masked', 'true');
    }
}
