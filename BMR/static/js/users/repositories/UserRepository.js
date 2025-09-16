import { BaseRepository } from '../../shared/repositories/BaseRepository.js';
import { USERS } from '../../shared/config/apiConfig.js';

export class UserRepository extends BaseRepository {
    constructor(authService) {
        super(USERS.USERS, authService);
    }

    async getUsers(params = {}) {

        const result = await this.getList(params);

        return {
            users: result.items,
            pagination: result.pagination
        };
    }

//    async getUsers(params = {}) {
//        // console.log('🔧 UserRepository.getUsers called with params:', params);
//
//        const queryString = new URLSearchParams(params).toString();
//        const url = `${this.baseUrl}/?${queryString}`;
//        // console.log('🔧 Making request to:', url);
//
//        try {
//            const response = await this.makeRequest(url);
//            // console.log('✅ Raw API response:', response);
//
//            if (!response.ok) {
//                const errorText = await response.text();
//                console.error('❌ HTTP Error Response:', errorText);
//                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//            }
//
//            const jsonData = await response.json();
//            // console.log('✅ Parsed data:', data);
//
//            return {
//                users: jsonData?.data?.results || [],
//                pagination: jsonData?.data?.pagination || null,
//            };
//        } catch (error) {
//            console.error('❌ UserRepository.getUsers failed:', error);
//            throw error;
//        }
//    }

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