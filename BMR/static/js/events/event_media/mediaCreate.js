import { NotificationService } from '../../shared/services/NotificationService.js';
import { loadDropdown } from '../../shared/utils/dropdownHelper.js';
import { EventMediaUploadRepository } from './repositories/mediaUploadRepository.js';
import { EventRepository } from '../events/repositories/EventRepository.js';
import { EventSubCategoryRepository } from '../subcategories/repositories/EventSubCategoryRepository.js';

export async function initEventMediaUpload() {
    // Prevent multiple initializations
    if (window.__EVENT_MEDIA_INIT__) return;
    window.__EVENT_MEDIA_INIT__ = true;

    const form = document.getElementById('eventMediaForm');
    if (!form) return;

    if (form.dataset.initialized === 'true') return;
    form.dataset.initialized = 'true';

    const notification = new NotificationService();
    let isSubmitting = false;
    const eventRepo = new EventRepository();
    const eventMediaUploadRepo = new EventMediaUploadRepository();
    const subRepo = new EventSubCategoryRepository();
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedEventId = urlParams.get('event_id');
    const eventSelect = document.getElementById('event');
    const uploadSection = document.getElementById('upload_section');
    const urlSection = document.getElementById('url_section');
    const mediaFilesInput = document.getElementById('media_files');
    const embedUrlInput = document.getElementById('embed_url');
    const radioUpload = document.getElementById('media_source_upload');
    const radioUrl = document.getElementById('media_source_url');

    try {
        notification.showLoading('Loading dropdowns...');
        await loadDropdown(eventRepo, eventSelect);
        if (preselectedEventId && eventSelect) {
            eventSelect.value = preselectedEventId;
        }
        await loadDropdown(subRepo, document.getElementById('sub_category'));
        notification.hideLoading();
    } catch (err) {
        console.error(err);
        notification.hideLoading();
        notification.showError('Failed to load dropdowns.');
    }

    // toggle input sections
    const toggleSource = () => {
        const isUpload = radioUpload?.checked;
        if (uploadSection) uploadSection.classList.toggle('d-none', !isUpload);
        if (urlSection) urlSection.classList.toggle('d-none', isUpload);
        if (mediaFilesInput) {
            mediaFilesInput.required = !!isUpload;
            mediaFilesInput.value = '';
        }
        if (embedUrlInput) {
            embedUrlInput.required = !isUpload;
            embedUrlInput.value = '';
        }
    };
    [radioUpload, radioUrl].forEach(r => r && r.addEventListener('change', toggleSource));
    toggleSource();

    // handle form submission
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const formData = new FormData(form);
        // If source is URL, remove file inputs; else drop URL
        const source = form.querySelector('input[name="media_source"]:checked')?.value;
        if (source === 'url') {
            formData.delete('media_files');
        } else {
            formData.delete('embed_url');
        }

        isSubmitting = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
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
        } finally {
            isSubmitting = false;
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}
