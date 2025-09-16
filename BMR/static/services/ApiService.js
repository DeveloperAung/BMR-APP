/**
 * ApiService - Handles all API communications for the application
 */
class ApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.csrfToken = this.getCsrfToken();
    }

    /**
     * Get CSRF token from the DOM
     */
    getCsrfToken() {
        const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
        return tokenElement ? tokenElement.value : '';
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.csrfToken
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        if (!response.ok) {
            // Handle 401 Unauthorized
            if (response.status === 401) {
                const refreshed = await this.refreshToken();
                if (!refreshed) {
                    throw new Error('Session expired. Please login again.');
                }
                // Retry the request with the new token
                return this.request(response.url, {
                    method: response.method,
                    headers: response.headers,
                    body: response.body
                });
            }

            // Handle other errors
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || error.message || 'An error occurred');
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return null;
        }

        return response.json();
    }

    /**
     * Refresh the access token
     */
    async refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseUrl}/api/auth/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({ refresh: refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    /**
     * Make an API request
     */
    async request(url, options = {}) {
        const headers = {
            ...this.getAuthHeaders(),
            ...(options.headers || {})
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            return this.handleResponse(response);
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString
            ? `${this.baseUrl}${endpoint}?${queryString}`
            : `${this.baseUrl}${endpoint}`;

        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data = {}) {
        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE'
        });
    }

    /**
     * Upload a file
     */
    async uploadFile(endpoint, file, fieldName = 'file') {
        const formData = new FormData();
        formData.append(fieldName, file);

        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': this.csrfToken
            },
            body: formData
        });
    }
}

// Create a global instance
const apiService = new ApiService();

// Make it available globally
window.apiService = apiService;
