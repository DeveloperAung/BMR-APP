export class CategoryFilterHandler {
    constructor(onChange) {
        this.onChange = onChange;
    }

    init() {
        const searchInput = document.getElementById('searchCategories');
        const showAllCheckbox = document.getElementById('showAllCategories');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.onChange({ search: e.target.value, show_all: showAllCheckbox?.checked ? 'true' : 'false' });
            });
        }

        if (showAllCheckbox) {
            showAllCheckbox.addEventListener('change', (e) => {
                this.onChange({ search: searchInput?.value || '', show_all: e.target.checked ? 'true' : 'false' });
            });
        }
    }
}
