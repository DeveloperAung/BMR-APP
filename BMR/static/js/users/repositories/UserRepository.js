import { BaseRepository } from '../../shared/repositories/BaseRepository.js';
import { USERS } from '../../shared/config/apiConfig.js';

export class UserRepository extends BaseRepository {
    constructor() {
        super(USERS.USERS);
    }

    async getUsers(params = {}) {

        const result = await this.getList(params);

        return {
            users: result.items,
            pagination: result.pagination
        };
    }

    async getUser(userId) {
        console.log('🔧 UserRepository.getUser called with userId:', userId);

        try {
            const response = await this.makeRequest(`${this.baseUrl}/${userId}/`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error('❌ UserRepository.getUser failed:', error);
            throw error;
        }
    }

    async createUser(userData) {
        return this.makeRequest(`${this.baseUrl}/`, {
            method: 'POST',
            body: JSON.stringify(userData),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async updateUser(userId, userData) {
        return this.makeRequest(`${this.baseUrl}/${userId}/`, {
            method: 'PATCH',
            body: JSON.stringify(userData),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async deleteUser(userId) {
        return this.makeRequest(`${this.baseUrl}/${userId}/`, {
            method: 'DELETE'
        });
    }

    async makeRequest(url, options = {}) {
        console.log('🔧 Making HTTP request to:', url);
        console.log('🔧 Request options:', options);

        try {
            // Get valid token (with automatic refresh if needed)
            const token = await this.authService.getValidToken();
            console.log('🔧 Using token:', token ? 'Present' : 'Missing');

            const requestOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                    'X-CSRFToken': this.getCsrfToken()
                }
            };

            const response = await fetch(url, requestOptions);
            console.log('🔧 Response status:', response.status);

            return response;

        } catch (error) {
            console.error('❌ Request failed:', error);
            throw error;
        }
    }

    getCsrfToken() {
        // Try multiple ways to get CSRF token (same as your working code)
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

    getCsrfFromCookie() {
        const name = 'csrftoken';
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }
}