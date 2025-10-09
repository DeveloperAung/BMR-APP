import { NotificationService } from '../../shared/services/NotificationService.js';
import { loadDropdown } from '../../shared/utils/dropdownHelper.js';
import { EventMediaUploadRepository } from './repositories/mediaUploadRepository.js';
import { EventRepository } from '../events/repositories/EventRepository.js';
import { EventSubCategoryRepository } from '../subcategories/repositories/EventSubCategoryRepository.js';

export async function initEventMediaUpload() {
    const form = document.getElementById('eventMediaForm');
    if (!form) return;

    const notification = new NotificationService();
    const eventRepo = new EventRepository();
    const eventMediaUploadRepo = new EventMediaUploadRepository();
    const subRepo = new EventSubCategoryRepository();

    try {
        notification.showLoading('Loading dropdowns...');
        await loadDropdown(eventRepo, document.getElementById('event'));
        await loadDropdown(subRepo, document.getElementById('sub_category'));
        notification.hideLoading();
    } catch (err) {
        console.error(err);
        notification.hideLoading();
        notification.showError('Failed to load dropdowns.');
    }

    // handle form submission
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const formData = new FormData(form);
        notification.showLoading('Uploading media...');

        try {
            const response = await eventMediaUploadRepo.submitMedia(formData)
            notification.hideLoading();
            notification.showSuccess('Event Media created successfully!');
            setTimeout(() => {
                window.location.href = `/events/i/media-info/details/`;
            }, 1500);
        } catch (err) {
            notification.hideLoading();
            alert("Error")
            console.log("Error", err)
            notification.showError('Unexpected upload error.', err);
            console.error(err);
        }
    });
}
