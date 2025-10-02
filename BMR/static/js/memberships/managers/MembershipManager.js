// static/js/memberships/managers/MembershipManager.js
import { MembershipRepository } from '../repositories/MembershipRepository.js';

export class MembershipManager {
    constructor({ authService, notificationService }) {
        this.authService = authService;
        this.notificationService = notificationService;
        this.repository = new MembershipRepository({ notificationService });
    }

    async submitPage1(pageData) {
        this.notificationService?.showLoading?.('Creating membership step 1...');
        const response = await this.repository.submitPage1(pageData, true);
        this.notificationService?.hideLoading?.();
        return response;
    }

    async submitPage2(data) {
        try {
            console.log("Inside manager try")
            this.notificationService?.showLoading?.('Submitting application...');
            const response = await this.repository.submitPage2(data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            console.log("Inside manager catch")
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async getMyMembership() {
        try {
            return await this.repository.getMyMembership();
        } catch (error) {
            console.error('Failed to get membership:', error);
            throw error;
        }
    }

    async createOnlinePayment(data) {
        try {
            this.notificationService?.showLoading?.('Creating payment...');
            const response = await this.repository.createOnlinePayment(data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async createOfflinePayment(data) {
        try {
            this.notificationService?.showLoading?.('Recording payment...');
            const response = await this.repository.createOfflinePayment(data);
            this.notificationService?.hideLoading?.();
            return response;
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async listPayments() {
        try {
            return await this.repository.listPayments();
        } catch (error) {
            console.error('Failed to list payments:', error);
            throw error;
        }
    }
}