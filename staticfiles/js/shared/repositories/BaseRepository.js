import { apiService as authService } from '../services/AuthService.js';

/**
 * API Service class that handles HTTP requests with authentication
 */
class ApiService {
    constructor(authService, router = null) {
        this.authService = authService;
        this.baseUrl = window.location.origin;
        this.router = router;
    }

    /**
     * Make authenticated request
     */
    async request(url, options = {}) {
        try {
            // Get valid token (will refresh if needed)
            const token = await this.authService.getValidToken().catch(() => null);

            // Build full URL if relative
            const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

            // Prepare headers
            const headers = {
                // 'Content-Type': 'application/json',
                'X-CSRFToken': this.authService.getCsrfToken(),
                ...options.headers
            };

            if (!(options.body instanceof FormData)) {
              headers['Content-Type'] = 'application/json';
            }

            // Add auth header if token available
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Make request
            const response = await fetch(fullUrl, {
                ...options,
                headers
            });

            // Handle 401 Unauthorized
            if (response.status === 401 && token) {
                try {
                    const newToken = await this.authService.refreshToken();
                    headers['Authorization'] = `Bearer ${newToken}`;

                    // Retry request with new token
                    const retryResponse = await fetch(fullUrl, {
                        ...options,
                        headers
                    });

                    return this.handleResponse(retryResponse);
                } catch (error) {
                    // Refresh failed, logout user
                    this.authService.logout();
                    this.redirectToLogin();
                    throw new Error('Authentication failed. Please login again.');
                }
            }

            return this.handleResponse(response);
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }

    redirectToLogin() {
        if (this.router) {
            // For React Router
            this.router.navigate('/login');
            // Or for Vue Router: this.router.push('/login');
        } else {
            // Fallback to window.location
            window.location.href = '/login';
        }
    }

    /**
     * Handle response and parse JSON
     */
    async handleResponse(response) {
        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch {
                // no JSON body
            }

            const error = new Error(
                errorData?.detail || errorData?.message || `HTTP ${response.status}`
            );
            error.status = response.status;
            error.data = errorData;
            // mimic axios style for downstream code
            error.response = { status: response.status, data: errorData, headers: response.headers };

            throw error;
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true };
        }

        try {
            return await response.json();
        } catch (error) {
            console.error('Failed to parse JSON response:', error);
            return { success: true };
        }
    }

    /**
     * GET request
     */
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const urlWithParams = queryString ? `${url}?${queryString}` : url;

        return this.request(urlWithParams, {
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(url, data = {}) {
        if (data instanceof FormData) {
            const token = await this.authService.getValidToken().catch(() => null);

            const headers = {'X-CSRFToken': this.authService.getCsrfToken()};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers,
                body: data
            });
            return this.handleResponse(response);
        }

        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PATCH request
     */
    async patch(url, data = {}) {
        if (data instanceof FormData) {
            const token = await this.authService.getValidToken().catch(() => null);

            const headers = {'X-CSRFToken': this.authService.getCsrfToken()};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
            const response = await fetch(fullUrl, {
                method: 'PATCH',
                headers,
                body: data
            });
            return this.handleResponse(response);
        }

        return this.request(url, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(url, data = {}) {

        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    }

    /**
     * Upload file
     */
    async uploadFile(url, file, fieldName = 'file', additionalData = {}) {
        try {
            const token = await this.authService.getValidToken().catch(() => null);

            const formData = new FormData();
            formData.append(fieldName, file);

            // Add additional data to form
            for (const [key, value] of Object.entries(additionalData)) {
                formData.append(key, value);
            }

            const headers = {
                'X-CSRFToken': this.authService.getCsrfToken()
                // Don't set Content-Type - browser will set it with boundary for multipart/form-data
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

            const response = await fetch(fullUrl, {
                method: 'POST',
                headers,
                body: formData
            });

            return this.handleResponse(response);
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }
}

// Create API service instance using the auth service
const apiServiceInstance = new ApiService(authService, null);

/**
 * Base Repository class for data access
 */
export class BaseRepository {
    constructor(baseEndpoint, apiService = null) {
        this.baseEndpoint = baseEndpoint;
        this.apiService = apiService || apiServiceInstance;
        
        if (!this.apiService || !this.apiService.get) {
            console.error('API Service is not properly initialized in BaseRepository');
        }
    }

    normalizedEndpoint() {
        return this.baseEndpoint.replace(/\/$/, '');
    }

    /**
     * Get list of items with pagination
     */
    async getList(params = {}) {
        try {
            const base = this.normalizedEndpoint();
            const jsonData = await this.apiService.get(`${base}/`, params);
            return this.extractListData(jsonData);
        } catch (error) {
            console.error(`${this.constructor.name}.getList failed:`, error);
            throw error;
        }
    }

    /**
     * Get single item by ID
     */
    async getItem(id) {
        try {
            const base = this.normalizedEndpoint();
            const jsonData = await this.apiService.get(`${base}/${id}/`);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error(`${this.constructor.name}.getItem failed:`, error);
            throw error;
        }
    }

    /**
     * Create new item
     */
    async createItem(data) {
        try {
            const base = this.normalizedEndpoint();
            const jsonData = await this.apiService.post(`${base}/`, data);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error(`${this.constructor.name}.createItem failed:`, error);
            throw error;
        }
    }

    /**
     * Update existing item
     */
    async updateItem(id, data) {
        try {
            const base = this.normalizedEndpoint();
            const jsonData = await this.apiService.patch(`${base}/${id}/`, data);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error(`${this.constructor.name}.updateItem failed:`, error);
            throw error;
        }
    }

    async toggleStatus(id, isActive) {
        if (!id) throw new Error("Entity ID is required for toggleStatus");

        try {
            const jsonData = await this.updateItem(id, { is_active: isActive });
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error(`${this.constructor.name}.toggleStatus failed:`, error);
            throw error;
        }
    }

    async togglePublish(id, isPublish) {
        if (!id) throw new Error("Entity ID is required for togglePublish");

        try {
            const jsonData = await this.updateItem(id, { is_published: isPublish });
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error(`${this.constructor.name}.togglePublish failed:`, error);
            throw error;
        }
    }

    /**
     * Bulk operations
     */
    async bulkOperation(operation, ids, data = {}) {
        try {
            const payload = { ids, ...data };
            const jsonData = await this.apiService.post(`${this.baseEndpoint}/bulk_${operation}/`, payload);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error(`${this.constructor.name}.bulk${operation} failed:`, error);
            throw error;
        }
    }

    /**
     * Extract list data from API response
     * Handles both your custom format and DRF format
     */
    extractListData(jsonData) {
        // Handle your custom format: { success: true, data: { results: [...], pagination: {...} } }
        // Handle DRF format: { results: [...], count: 123, next: "...", previous: "..." }

        const results = jsonData?.data?.results || jsonData?.results || [];
        let pagination = jsonData?.data?.pagination || null;

        // If no pagination but we have DRF format, extract it
        if (!pagination && jsonData.count !== undefined) {
            pagination = this.extractDRFPagination(jsonData);
        }

        return {
            items: results,
            pagination: pagination
        };
    }

    /**
     * Convert DRF pagination to your standard format
     */
    extractDRFPagination(jsonData) {
        if (!jsonData.count) return null;

        const count = jsonData.count;
        const pageSize = jsonData.results?.length || 30;
        const totalPages = Math.ceil(count / pageSize);

        // Extract page number from next/previous URLs
        let currentPage = 1;
        if (jsonData.previous) {
            try {
                const prevUrl = new URL(jsonData.previous);
                const prevPage = parseInt(prevUrl.searchParams.get('page') || '1');
                currentPage = prevPage + 1;
            } catch (e) {
                console.warn('Failed to parse previous URL:', jsonData.previous);
            }
        } else if (jsonData.next) {
            try {
                const nextUrl = new URL(jsonData.next);
                const nextPage = parseInt(nextUrl.searchParams.get('page') || '2');
                currentPage = nextPage - 1;
            } catch (e) {
                console.warn('Failed to parse next URL:', jsonData.next);
            }
        }

        return {
            current_page: currentPage,
            total_pages: totalPages,
            total_count: count,
            per_page: pageSize,
            has_next: !!jsonData.next,
            has_previous: !!jsonData.previous,
            next_page: jsonData.next ? currentPage + 1 : null,
            previous_page: jsonData.previous ? currentPage - 1 : null
        };
    }

    /**
     * Upload file for this resource
     */
    async uploadFile(id, file, fieldName = 'file', additionalData = {}) {
        try {
            const endpoint = id ? `${this.baseEndpoint}/${id}/upload/` : `${this.baseEndpoint}/upload/`;
            const jsonData = await this.apiService.uploadFile(endpoint, file, fieldName, additionalData);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error(`${this.constructor.name}.uploadFile failed:`, error);
            throw error;
        }
    }

    /**
     * Search items
     */
    async search(query, additionalParams = {}) {
        try {
            const params = {
                search: query,
                ...additionalParams
            };
            return this.getList(params);
        } catch (error) {
            console.error(`${this.constructor.name}.search failed:`, error);
            throw error;
        }
    }

    /**
     * Get items by filter
     */
    async getByFilter(filters = {}) {
        try {
            return this.getList(filters);
        } catch (error) {
            console.error(`${this.constructor.name}.getByFilter failed:`, error);
            throw error;
        }
    }

    /**
     * Check if item exists
     */
    async exists(id) {
        try {
            await this.getItem(id);
            return true;
        } catch (error) {
            if (error.message.includes('404')) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get total count
     */
    async getTotalCount(filters = {}) {
        try {
            const response = await this.getList({ ...filters, per_page: 1 });
            return response.pagination?.total_count || 0;
        } catch (error) {
            console.error(`${this.constructor.name}.getTotalCount failed:`, error);
            return 0;
        }
    }
}

// Export the API service for use in other modules if needed
export { apiServiceInstance as apiService };

// Export default
export default BaseRepository;
