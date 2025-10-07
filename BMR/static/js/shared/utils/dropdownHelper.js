export async function loadDropdown(source, selectEl, labelKey = 'title') {
    let items = [];

    try {
        if (typeof source === 'string') {
            // Direct URL version
            const res = await fetch(source, {
                credentials: 'include', // include session cookies
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const json = await res.json();
            items = Array.isArray(json) ? json : json.data || json.results || [];
        } else if (source && typeof source.getList === 'function') {
            // Repository version
            const response = await source.getList();
            items = response.items || response.data || response.results || [];
        }

        // Clear existing and add default
        selectEl.innerHTML = '<option value="">-- Select --</option>';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item[labelKey];
            selectEl.appendChild(option);
        });
    } catch (error) {
        console.error('Dropdown load error:', error);
        selectEl.innerHTML = '<option value="">(Failed to load)</option>';
    }
}