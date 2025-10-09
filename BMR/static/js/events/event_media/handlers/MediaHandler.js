import { loadDropdown } from '../../../shared/utils/dropdownHelper.js';
import { EventRepository } from "../../events/repositories/EventRepository.js";
import { SubCateDropDownRepository } from "../repositories/subCategoryDropdownRepo.js";
import { EventMediaManager } from "../managers/mediaManager.js";

export class EventMediaHandler {
    constructor({ authService, notificationService }) {
        if (!authService) throw new Error("AuthService is required");
        if (!notificationService) throw new Error("NotificationService is required");

        this.authService = authService;
        this.notificationService = notificationService;

        this.eventRepo = new EventRepository();
        this.subCateDropdownRepo = new SubCateDropDownRepository();
        this.mediaManager = new EventMediaManager({
            authService,
            notificationService
        });

        this.eventSelect = document.getElementById('event');
        this.subCategorySelect = document.getElementById('sub_category');
        this.accordion = document.getElementById('simpleaccordion');
        this.subCategoryWrapper = this.subCategorySelect.closest('.col-md-6');
    }

    async init() {
        try {
            this.notificationService.showLoading('Loading events...');
            await loadDropdown(this.eventRepo, this.eventSelect);
            this.notificationService.hideLoading();
        } catch (err) {
            console.error(err);
            this.notificationService.hideLoading();
            this.notificationService.showError('Failed to load event dropdown.');
        }

        this.bindEvents();
    }

    bindEvents() {
        this.eventSelect.addEventListener('change', async () => {
            const eventId = this.eventSelect.value;
            if (!eventId) {
                this.subCategorySelect.innerHTML = '<option value="">-- Select Subcategory --</option>';
                return;
            }

            await this.loadSubCategories(eventId);
            await this.loadEventMedia({ eventId });
        });

        this.subCategorySelect.addEventListener('change', async () => {
            const eventId = this.eventSelect.value;
            const subCategoryId = this.subCategorySelect.value;
            if (!eventId) return;
            await this.loadEventMedia({ eventId, subCategoryId });
        });
    }

    async loadSubCategories(eventId) {
        this.subCategorySelect.innerHTML = '<option>Loading...</option>';
        try {
            const response = await this.subCateDropdownRepo.getSubCategoriesByEvent(eventId);
            const items = Array.isArray(response)
                ? response
                : response.items || response.results || [];
            this.subCategorySelect.innerHTML = '<option value="">-- Select Subcategory --</option>';
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.title;
                this.subCategorySelect.appendChild(option);
            });
            this.subCategoryWrapper.style.display = 'block';
        } catch (error) {
            console.error('Error loading subcategories:', error);
            this.subCategorySelect.innerHTML = '<option value="">(Failed to load)</option>';
            this.subCategoryWrapper.style.display = 'block';
        }
    }

    async loadEventMedia({ eventId, subCategoryId = null }) {
        const container = this.accordion;
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 mb-0">Loading media...</p>
            </div>
        `;
        try {
            const filters = {};
            if (eventId) filters.event_id = eventId;
            if (subCategoryId) filters.subcategory_id = subCategoryId;

            const response = await this.mediaManager.loadEventMedia({ eventId, subCategoryId });

            container.innerHTML = '';

            this.renderMediaAccordion(response);
        } catch (error) {
            console.error('Error loading event media:', error);

            container.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="fa-solid fa-triangle-exclamation me-1"></i>
                    Failed to load media files. Please try again.
                </div>
            `;
        }
    }

    renderMediaAccordion(mediaList) {
        const container = this.accordion;
        container.innerHTML = '';

        if (!mediaList || mediaList.length === 0) {
            container.innerHTML =
                '<div class="alert alert-info">No media found for the selected filters.</div>';
            return;
        }

        const grouped = mediaList.reduce((acc, item) => {
            console.log("Item", item)
            const key = item.event_title + "  ( " + item.subcategory_title + " )" || 'Uncategorized';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([subcat, items], index) => {
            const collapseId = `collapse${index}`;
            const headingId = `heading${index}`;
            const itemHtml = `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headingId}">
                        <button class="accordion-button accordion-light-primary text-primary ${
                            index === 0 ? '' : 'collapsed'
                        }"
                            type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}"
                            aria-expanded="${index === 0}" aria-controls="${collapseId}">
                            ${subcat}
                            <i class="iconly-Arrow-Down-2 icli ms-auto icon"></i>
                        </button>
                    </h2>
                    <div class="accordion-collapse collapse ${
                        index === 0 ? 'show' : ''
                    }" id="${collapseId}"
                        aria-labelledby="${headingId}" data-bs-parent="#simpleaccordion">
                        <div class="accordion-body d-flex flex-wrap gap-3">
                            <div class="row">
                                ${items.map(this.renderMediaCard).join('')}
                            </div>                            
                        </div>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', itemHtml);
        });
    }

    renderMediaCard(media) {
        const icon = media.file_type?.includes('image')
            ? '<i class="fa-solid fa-image text-primary fs-4"></i>'
            : '<i class="fa-solid fa-file-video text-danger fs-4"></i>';

        return `
            <div class="border mb-2 rounded p-2 shadow-sm d-flex align-items-center gap-2" style="min-width:220px;">
                ${icon}
                <div class="d-flex flex-column">
                    <span class="fw-semibold">${media.title}</span>
                    <small class="text-muted">${media.media_type}</small>
                </div>
            </div>
        `;
    }
}
