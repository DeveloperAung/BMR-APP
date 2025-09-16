import { apiService } from './ApiService.js';

/**
 * UserService - Handles all user-related API operations
 */
class UserService {
    constructor() {
        this.baseEndpoint = '/api/auth/users';
    }

    /**
     * Get a list of users with pagination and filtering
     */
    async getUsers(params = {}) {
        const defaultParams = {
            page: 1,
            per_page: 30,
            ordering: '-date_joined',
            ...params
        };

        return apiService.get(this.baseEndpoint, defaultParams);
    }

    /**
     * Get a single user by ID
     */
    async getUser(userId) {
        return apiService.get(`${this.baseEndpoint}/${userId}/`);
    }

    /**
     * Create a new user
     */
    async createUser(userData) {
        return apiService.post(this.baseEndpoint, userData);
    }

    /**
     * Update an existing user
     */
    async updateUser(userId, userData) {
        return apiService.patch(`${this.baseEndpoint}/${userId}/`, userData);
    }

    /**
     * Delete a user
     */
    async deleteUser(userId) {
        return apiService.delete(`${this.baseEndpoint}/${userId}/`);
    }

    /**
     * Update user's password
     */
    async updatePassword(userId, currentPassword, newPassword) {
        return apiService.post(`${this.baseEndpoint}/${userId}/change-password/`, {
            current_password: currentPassword,
            new_password: newPassword
        });
    }

    /**
     * Upload profile picture
     */
    async uploadProfilePicture(userId, file) {
        const formData = new FormData();
        formData.append('profile_picture', file);

        return apiService.request(`${this.baseEndpoint}/${userId}/profile-picture/`, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * Search users
     */
    async searchUsers(query, params = {}) {
        return this.getUsers({
            ...params,
            search: query
        });
    }
}

// Create a global instance
const userService = new UserService();

// Make it available globally
window.userService = userService;
