import { loadDropdown } from '../../shared/utils/dropdownHelper.js';
import { EventRepository } from "../events/repositories/EventRepository.js";
import { NotificationService } from "../../shared/services/NotificationService.js";
import {SubCateDropDownRepository} from "./repositories/subCategoryDropdownRepo.js";
import {EventMediaInfoRepository} from "./repositories/mediaInfoRepository.js";

export async function initEventSubCategoryHandler() {
    const eventSelect = document.getElementById('event');
    const subCategorySelect = document.getElementById('sub_category');
    const subCategoryWrapper = subCategorySelect.closest('.col-md-6');

    const eventRepo = new EventRepository();
    const subCateDropdownRepo = new SubCateDropDownRepository();
    const eventMediaInfoRepo = new EventMediaInfoRepository();
    const notification = new NotificationService();

    try {
        notification.showLoading('Loading dropdowns...');
        await loadDropdown(eventRepo, document.getElementById('event'));
        notification.hideLoading();
    } catch (err) {
        console.error(err);
        notification.hideLoading();
        notification.showError('Failed to load dropdowns.');
    }

    eventSelect.addEventListener('change', async () => {
        const eventId = eventSelect.value;

        if (!eventId) {
            subCategorySelect.innerHTML = '<option value="">-- Select Subcategory --</option>';
            // subCategoryWrapper.style.display = 'none';
            return;
        }

        subCategorySelect.innerHTML = '<option>Loading...</option>';

        try {
            let items = [];
            let selectEl = document.getElementById('sub_category')
            const response = await subCateDropdownRepo.getSubCategoriesByEvent(eventId);
            items = Array.isArray(response) ? response : response.items || response.results || [];
            try{
                selectEl.innerHTML = '<option value="">-- Select Subcategory --</option>';
                items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    console.log("data", item['title']);
                    option.textContent = item['title'];
                    selectEl.appendChild(option);
                });
            }
            catch (error)
            {
                console.error('Dropdown load error:', error);
                selectEl.innerHTML = '<option value="">(Failed to load)</option>';
            }

            subCategoryWrapper.style.display = 'block';
        } catch (err) {
            console.error('Error loading subcategories:', err);
            subCategorySelect.innerHTML = '<option value="">-- Failed to load subcategories --</option>';
            subCategoryWrapper.style.display = 'block';
        }
    });
}
