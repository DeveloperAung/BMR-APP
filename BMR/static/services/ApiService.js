class ApiService {
    constructor(baseUrl = '', authService = null) {
        this.baseUrl = baseUrl;
        this.authService = authService;
        this.isRefreshing = false;
        this.refreshSubscribers = [];
    }

    /**
     * Get CSRF token from the DOM - dynamically updated
     */
    getCsrfToken() {
        // Try multiple ways to get CSRF token
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            return metaToken.getAttribute('content');
        }

        const inputToken = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (inputToken) {
            return inputToken.value;
        }

        // Try cookie method
        const cookieToken = this.getCsrfFromCookie();
        if (cookieToken) {
            return cookieToken;
        }

        console.warn('CSRF token not found');
        return '';
    }

    getCsrfFromCookie() {
        const name = 'csrftoken';
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    /**
     * Get authentication headers with proper token management
     */
    async getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCsrfToken() // Get fresh CSRF token each time
        };

        // Use AuthService if available, otherwise fallback to localStorage
        if (this.authService) {
            try {
                const token = await this.authService.getValidToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            } catch (error) {
                console.warn('Failed to get valid token:', error);
            }
        } else {
            const token = localStorage.getItem('access_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Enhanced response handler - supports your custom format
     */
    async handleResponse(response, originalRequest = null) {
        // Handle 401 Unauthorized with proper retry logic
        if (response.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshed = await this.handleTokenRefresh();
            if (refreshed) {
                // Retry the original request with new token
                const newHeaders = await this.getAuthHeaders();
                const retryRequest = {
                    ...originalRequest,
                    headers: { ...originalRequest.headers, ...newHeaders }
                };
                
                const retryResponse = await fetch(originalRequest.url, retryRequest);
                return this.handleResponse(retryResponse);
            } else {
                // Redirect to login or throw error
                this.handleAuthFailure();
                throw new Error('Session expired. Please login again.');
            }
        }

        // Handle other HTTP errors
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            
            try {
                const errorData = await response.json();
                
                // Handle your custom error format
                if (errorData.success === false) {
                    errorMessage = errorData.message || errorMessage;
                } else {
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                }
            } catch (e) {
                // If response is not JSON, try to get text
                try {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                } catch (e2) {
                    // Use default error message
                }
            }
            
            console.error('❌ API Error:', errorMessage);
            throw new Error(errorMessage);
        }

        // Handle successful responses
        const contentType = response.headers.get('content-type');
        
        // Handle 204 No Content
        if (response.status === 204) {
            return { success: true };
        }

        // Handle JSON responses
        if (contentType && contentType.includes('application/json')) {
            const jsonData = await response.json();
            
            // Handle your custom error format even in 200 responses
            if (jsonData.success === false) {
                throw new Error(jsonData.message || 'API request failed');
            }
            
            return jsonData;
        }

        // Handle text responses
        const textData = await response.text();
        return textData ? { data: textData } : { success: true };
    }

    /**
     * Improved token refresh with queue management
     */
    async handleTokenRefresh() {
        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing) {
            return new Promise((resolve) => {
                this.refreshSubscribers.push(resolve);
            });
        }

        this.isRefreshing = true;

        try {
            let refreshed = false;

            // Use AuthService if available
            if (this.authService && this.authService.refreshToken) {
                try {
                    await this.authService.refreshToken();
                    refreshed = true;
                } catch (error) {
                    console.error('AuthService refresh failed:', error);
                }
            } else {
                // Fallback to manual refresh
                refreshed = await this.refreshTokenManual();
            }

            // Notify all waiting requests
            this.refreshSubscribers.forEach(callback => callback(refreshed));
            this.refreshSubscribers = [];

            return refreshed;
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * Manual token refresh (fallback)
     */
    async refreshTokenManual() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseUrl}/api/auth/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ refresh: refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access);
                
                // Update refresh token if provided
                if (data.refresh) {
                    localStorage.setItem('refresh_token', data.refresh);
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Manual token refresh failed:', error);
            return false;
        }
    }

    /**
     * Handle authentication failure
     */
    handleAuthFailure() {
        // Clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Dispatch event for other parts of the app to handle
        window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
        
        // You could also redirect to login here
        // window.location.href = '/login/';
    }

    /**
     * Make an API request with enhanced error handling
     */
    async request(url, options = {}) {
        const headers = await this.getAuthHeaders();
        
        const config = {
            ...options,
            headers: { ...headers, ...(options.headers || {}) },
            url: url // Store URL for retry logic
        };

        try {
            console.log('🔧 Making API request:', url, config);
            const response = await fetch(url, config);
            return this.handleResponse(response, config);
        } catch (error) {
            console.error('❌ API request failed:', error);
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
     * Upload a file with better error handling
     */
    async uploadFile(endpoint, file, fieldName = 'file', additionalData = {}) {
        const formData = new FormData();
        formData.append(fieldName, file);

        // Add additional form data if provided
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        // Don't set Content-Type for FormData - let browser set it with boundary
        const headers = {
            'X-CSRFToken': this.getCsrfToken()
        };

        // Add auth header if available
        if (this.authService) {
            try {
                const token = await this.authService.getValidToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            } catch (error) {
                console.warn('Failed to get token for file upload:', error);
            }
        } else {
            const token = localStorage.getItem('access_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
    }

    /**
     * Batch requests helper
     */
    async batchRequest(requests) {
        try {
            const promises = requests.map(req => 
                this.request(req.url, req.options || {})
            );
            return await Promise.allSettled(promises);
        } catch (error) {
            console.error('Batch request failed:', error);
            throw error;
        }
    }

    /**
     * Set AuthService instance
     */
    setAuthService(authService) {
        this.authService = authService;
    }
}

// Create a global instance with no auth service initially
const apiService = new ApiService();

// Make it available globally
window.apiService = apiService;

export { ApiService };
export default apiService;