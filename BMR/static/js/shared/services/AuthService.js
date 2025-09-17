export class AuthService {
    constructor() {
        this.tokenKey = 'access_token';
        this.refreshTokenKey = 'refresh_token';
        this.userKey = 'current_user';
        this.baseUrl = '/api/auth';

        // Event system for authentication state changes
        this.eventTarget = new EventTarget();

        // Token refresh state management
        this.isRefreshing = false;
        this.refreshSubscribers = [];

        // Initialize token validation
        this.initializeTokenValidation();
    }

    /**
     * Initialize automatic token validation on page load
     */
    initializeTokenValidation() {
        const token = this.getToken();
        if (token && this.isTokenExpired(token)) {
            console.log('Token expired on page load, attempting refresh...');
            this.refreshToken().catch(() => {
                this.logout();
            });
        }
    }

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        if (this.isTokenExpired(token)) {
            try {
                await this.refreshToken();
                return true;
            } catch (error) {
                console.error('Token refresh failed:', error);
                return false;
            }
        }

        return true;
    }

    /**
     * Get stored access token
     * @returns {string|null}
     */
    getToken() {
        try {
            return localStorage.getItem(this.tokenKey);
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return null;
        }
    }

    /**
     * Get stored refresh token
     * @returns {string|null}
     */
    getRefreshToken() {
        try {
            return localStorage.getItem(this.refreshTokenKey);
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return null;
        }
    }

    /**
     * Get current user data
     * @returns {Object|null}
     */
    getCurrentUser() {
        try {
            const userData = localStorage.getItem(this.userKey);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    /**
     * Get a valid token, refreshing if necessary
     * @returns {Promise<string>}
     * @throws {Error} If unable to get valid token
     */
    async getValidToken() {
        const token = this.getToken();

        if (!token) {
            throw new Error('No access token available');
        }

        if (this.isTokenExpired(token)) {
            // If token is expired, refresh it
            const newToken = await this.refreshToken();
            return newToken;
        }

        return token;
    }

    /**
     * Check if token is expired
     * @param {string} token - JWT token
     * @returns {boolean}
     */
    isTokenExpired(token) {
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            // Add 5 minute buffer before expiration
            const buffer = 5 * 60; // 5 minutes
            return payload.exp < (currentTime + buffer);
        } catch (error) {
            console.error('Error parsing token:', error);
            return true;
        }
    }

    /**
     * Get token expiration time
     * @param {string} token - JWT token
     * @returns {Date|null}
     */
    getTokenExpiry(token) {
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return new Date(payload.exp * 1000);
        } catch (error) {
            console.error('Error parsing token expiry:', error);
            return null;
        }
    }

    /**
     * Login with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} User data and tokens
     */
    async login(email, password) {
        try {
            const response = await this.makeRequest(`${this.baseUrl}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            await this.handleSuccessfulAuth(data);
            return data;

        } catch (error) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Login failed. Please try again.');
        }
    }

    /**
     * Refresh the access token
     * @returns {Promise<string>} New access token
     */
    async refreshToken() {
        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing) {
            return new Promise((resolve) => {
                this.refreshSubscribers.push(resolve);
            });
        }

        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        this.isRefreshing = true;

        try {
            const response = await this.makeRequest(`${this.baseUrl}/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ refresh: refreshToken })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();

            // Store new access token
            localStorage.setItem(this.tokenKey, data.access);

            // If new refresh token provided, update it
            if (data.refresh) {
                localStorage.setItem(this.refreshTokenKey, data.refresh);
            }

            // Notify all waiting requests
            this.refreshSubscribers.forEach(callback => callback(data.access));
            this.refreshSubscribers = [];

            this.dispatchEvent('tokenRefreshed', { token: data.access });

            return data.access;

        } catch (error) {
            console.error('Token refresh error:', error);

            // Clear invalid tokens and notify subscribers
            this.logout();
            this.refreshSubscribers.forEach(callback => callback(null));
            this.refreshSubscribers = [];

            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * Logout user and clear all stored data
     */
    async logout() {
        try {
            const refreshToken = this.getRefreshToken();

            // Attempt to blacklist refresh token on server
            if (refreshToken) {
                await this.makeRequest(`${this.baseUrl}/logout/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`,
                        'X-CSRFToken': this.getCsrfToken()
                    },
                    body: JSON.stringify({ refresh: refreshToken })
                }).catch(error => {
                    // Log but don't throw - we still want to clear local storage
                    console.warn('Server logout failed:', error);
                });
            }
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            // Always clear local storage regardless of server response
            this.clearStoredData();
            this.dispatchEvent('logout');
        }
    }

    /**
     * Handle successful authentication response
     * @param {Object} authData - Authentication response data
     */
    async handleSuccessfulAuth(authData) {
        try {
            console.log('try handle successful auth')
            // Store tokens
            if (authData.access) {
                localStorage.setItem(this.tokenKey, authData.access);
            }
            if (authData.refresh) {
                localStorage.setItem(this.refreshTokenKey, authData.refresh);
            }

            // Store user data
            if (authData.user) {
                localStorage.setItem(this.userKey, JSON.stringify(authData.user));
            } else if (authData.access) {
                // If user data not provided, fetch it using the token
                try {
                    const userData = await this.fetchCurrentUser();
                    localStorage.setItem(this.userKey, JSON.stringify(userData));
                } catch (error) {
                    console.warn('Failed to fetch user data after login:', error);
                }
            }

            this.dispatchEvent('login', authData);

        } catch (error) {
            console.error('Error handling successful auth:', error);
            throw error;
        }
    }

    /**
     * Fetch current user data from server
     * @returns {Promise<Object>} User data
     */
    async fetchCurrentUser() {
        const token = await this.getValidToken();

        const response = await this.makeRequest(`${this.baseUrl}/user/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        return response.json();
    }

    /**
     * Clear all stored authentication data
     */
    clearStoredData() {
        try {
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.refreshTokenKey);
            localStorage.removeItem(this.userKey);
        } catch (error) {
            console.error('Error clearing stored data:', error);
        }
    }

    /**
     * Get CSRF token for requests
     * @returns {string}
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

        const cookieToken = this.getCsrfFromCookie();
        if (cookieToken) {
            return cookieToken;
        }

        console.warn('CSRF token not found');
        return '';
    }

    /**
     * Extract CSRF token from cookies
     * @returns {string|null}
     */
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
     * Make HTTP request with error handling
     * @param {string} url
     * @param {Object} options
     * @returns {Promise<Response>}
     */
    async makeRequest(url, options = {}) {
        const requestOptions = {
            ...options,
            headers: {
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            return response;
        } catch (error) {
            console.error('Network request failed:', error);
            throw new Error('Network error. Please check your connection.');
        }
    }

    /**
     * Add event listener for auth events
     * @param {string} event - Event name ('login', 'logout', 'tokenRefreshed')
     * @param {Function} callback - Event handler
     */
    addEventListener(event, callback) {
        this.eventTarget.addEventListener(event, callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     */
    removeEventListener(event, callback) {
        this.eventTarget.removeEventListener(event, callback);
    }

    /**
     * Dispatch auth event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    dispatchEvent(event, data = null) {
        this.eventTarget.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    /**
     * Check if current user has specific role/permission
     * @param {string} permission - Permission to check
     * @returns {boolean}
     */
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;

        switch (permission) {
            case 'admin':
                return user.is_superuser || false;
            case 'staff':
                return user.is_staff || false;
            case 'verified':
                return user.is_email_verified || false;
            default:
                return user.permissions?.includes(permission) || false;
        }
    }

    /**
     * Get user's role string
     * @returns {string}
     */
    getUserRole() {
        const user = this.getCurrentUser();
        if (!user) return 'guest';

        if (user.is_superuser) return 'superuser';
        if (user.is_staff) return 'staff';
        return 'user';
    }

    /**
     * Check if user account is active
     * @returns {boolean}
     */
    isAccountActive() {
        const user = this.getCurrentUser();
        return user?.is_active || false;
    }

    /**
     * Get time until token expires
     * @returns {number|null} Minutes until expiration
     */
    getTokenTimeRemaining() {
        const token = this.getToken();
        if (!token) return null;

        const expiry = this.getTokenExpiry(token);
        if (!expiry) return null;

        const now = new Date();
        const remaining = expiry.getTime() - now.getTime();

        return Math.floor(remaining / (1000 * 60)); // Convert to minutes
    }

    /**
     * Setup automatic token refresh before expiration
     * @param {number} bufferMinutes - Minutes before expiration to refresh
     */
    setupAutoRefresh(bufferMinutes = 5) {
        const checkInterval = 60000; // Check every minute

        setInterval(async () => {
            const remaining = this.getTokenTimeRemaining();
            if (remaining !== null && remaining <= bufferMinutes && remaining > 0) {
                try {
                    await this.refreshToken();
                    console.log('Token auto-refreshed successfully');
                } catch (error) {
                    console.error('Auto refresh failed:', error);
                    this.logout();
                }
            }
        }, checkInterval);
    }

    /**
     * Initialize auth service with auto-refresh
     */
    init() {
        this.setupAutoRefresh();

        // Listen for storage events from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === this.tokenKey || event.key === this.refreshTokenKey) {
                if (!event.newValue) {
                    // Token removed in another tab
                    this.dispatchEvent('logout');
                }
            }
        });
    }
}

// Export singleton instance
export const apiService = new AuthService();