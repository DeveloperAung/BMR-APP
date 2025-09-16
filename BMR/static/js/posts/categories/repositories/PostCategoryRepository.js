export class PostCategoryRepository {
    constructor(authService) {
        this.authService = authService;
        this.baseUrl = '/api/posts/categories/';
    }

    async getCategories(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseUrl}?${queryString}`;
        return this.makeRequest(url, { method: 'GET' })
            .then(res => res.json())
            .then(json => {
                if (json.status !== 'ok') throw new Error(json.message || 'Failed to fetch categories');
                return {
                    categories: json.data.results || [],
                    pagination: json.data.pagination || null
                };
            });
    }

    async createCategory(data) {
        return this.makeRequest(this.baseUrl, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json());
    }

    async makeRequest(url, options = {}) {
        const token = await this.authService.getValidToken();
        const requestOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'X-CSRFToken': this.getCsrfToken()
            }
        };
        return fetch(url, requestOptions);
    }

    getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) return meta.getAttribute('content');
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
    }
}
