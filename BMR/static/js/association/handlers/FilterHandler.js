// static/js/association/handlers/FilterHandler.js
export class FilterHandler {
    constructor(onFiltersChange) {
        this.onFiltersChange = onFiltersChange;
        this.elements = {};
        this.currentFilters = {
            search: '',
            is_published: '',
            ordering: '-date_joined'
        };
        this.debounceTimer = null;
        this.debounceDelay = 300; // ms
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadSavedFilters();
    }

    cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            orderingSelect: document.getElementById('orderingSelect'),
            perPageSelect: document.getElementById('perPageSelect'),
            clearFiltersBtn: document.getElementById('clearFiltersBtn')
        };

        // Log missing elements for debugging
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                console.warn(`FilterHandler: Missing element ${key}`);
            }
        });
    }

    setupEventListeners() {
        // Search input with debouncing
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value);
            });

            this.elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch();
                }
            });
        }

        // Search button
        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => {
                this.handleSearch();
            });
        }

        // Filter dropdowns
        [
            { element: this.elements.verifiedFilter, key: 'is_published' },
            { element: this.elements.orderingSelect, key: 'ordering' }
        ].forEach(({ element, key }) => {
            if (element) {
                element.addEventListener('change', (e) => {
                    this.updateFilter(key, e.target.value);
                });
            }
        });

        // Per page select
        if (this.elements.perPageSelect) {
            this.elements.perPageSelect.addEventListener('change', (e) => {
                this.updateFilter('per_page', parseInt(e.target.value));
            });
        }

        // Clear filters button
        if (this.elements.clearFiltersBtn) {
            this.elements.clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    debouncedSearch(value) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updateFilter('search', value.trim());
        }, this.debounceDelay);
    }

    handleSearch() {
        clearTimeout(this.debounceTimer);
        const searchValue = this.elements.searchInput?.value.trim() || '';
        this.updateFilter('search', searchValue);
    }

    updateFilter(key, value) {
        const oldValue = this.currentFilters[key];
        this.currentFilters[key] = value;

        if (oldValue !== value) {
            this.saveFilters();
            this.onFiltersChange(this.currentFilters);
        }
    }

    clearAllFilters() {
        // Reset form elements
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.orderingSelect) this.elements.orderingSelect.value = '-published-date';
        if (this.elements.perPageSelect) this.elements.perPageSelect.value = '30';

        // Reset current filters
        this.currentFilters = {
            search: '',
            is_published: '',
            ordering: '-published-date',
            per_page: 30
        };

        this.saveFilters();
        this.onFiltersChange(this.currentFilters);
    }

    getFilters() {
        return { ...this.currentFilters };
    }

    setFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.updateFormElements();
        this.saveFilters();
    }

    updateFormElements() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = this.currentFilters.search || '';
        }
        if (this.elements.staffFilter) {
            this.elements.staffFilter.value = this.currentFilters.is_staff || '';
        }
        if (this.elements.verifiedFilter) {
            this.elements.verifiedFilter.value = this.currentFilters.is_verified || '';
        }
        if (this.elements.orderingSelect) {
            this.elements.orderingSelect.value = this.currentFilters.ordering || '-date_joined';
        }
        if (this.elements.perPageSelect) {
            this.elements.perPageSelect.value = this.currentFilters.per_page || '30';
        }
    }

    saveFilters() {
        try {
            localStorage.setItem('userFilters', JSON.stringify(this.currentFilters));
        } catch (error) {
            console.warn('Failed to save filters to localStorage:', error);
        }
    }

    loadSavedFilters() {
        try {
            const saved = localStorage.getItem('userFilters');
            if (saved) {
                const filters = JSON.parse(saved);
                this.setFilters(filters);
            }
        } catch (error) {
            console.warn('Failed to load saved filters:', error);
        }
    }
}