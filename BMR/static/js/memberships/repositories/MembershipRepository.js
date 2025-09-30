// static/js/memberships/repositories/MembershipRepository.js
import { BaseRepository } from '../../shared/repositories/BaseRepository.js';
import { ApiErrorHandler } from '../../shared/services/ApiErrorHandler.js';
import { API_ENDPOINTS } from '../../shared/config/apiConfig.js';

export class MembershipRepository extends BaseRepository {
    constructor({ notificationService } = {}) {
        const endpoint = API_ENDPOINTS?.MEMBERSHIP?.MEMBERSHIPS || '/api/membership/';
        super(endpoint);
        this.notificationService = notificationService;

        console.log('Initializing MembershipRepository with endpoint:', endpoint);
    }

    async submitPage1(pageData) {
        try {
            const page1_url =
                API_ENDPOINTS?.MEMBERSHIP?.SUBMIT_PAGE1 ||
                '/api/membership/submit-page1/';

            let jsonData;

            const hasFile = pageData.file && pageData.file.size > 0;

            if (hasFile) {
                const formData = new FormData();

                Object.entries(pageData.data.profile_info).forEach(([key, value]) => {
                    formData.append(`profile_info.${key}`, value || '');
                });

                Object.entries(pageData.data.contact_info).forEach(([key, value]) => {
                    formData.append(`contact_info.${key}`, value || '');
                });

                formData.append('membership_type', pageData.data.membership_type);

                formData.append('profile_picture', pageData.file);

                jsonData = await this.apiService.post(page1_url, formData);
            } else {
                jsonData = await this.apiService.post(page1_url, pageData.data);
            }

            return jsonData?.data || jsonData;
        } catch (error) {
            console.error('Submit page 1 failed:', error);
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }


    async submitPage2(data) {
        try {
            const jsonData = await this.apiService.post(`${this.baseEndpoint}submit-page2/`, data);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error('Submit page 2 failed:', error);
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getMyMembership() {
        try {
            const jsonData = await this.apiService.get(`${this.baseEndpoint}my-membership/`);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error('Get my membership failed:', error);
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async createOnlinePayment(paymentData) {
        try {
            const jsonData = await this.apiService.post(`${this.baseEndpoint}create-payment/`, paymentData);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error('Create online payment failed:', error);
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async createOfflinePayment(paymentData) {
        try {
            const jsonData = await this.apiService.post(`${this.baseEndpoint}offline-payment/`, paymentData);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error('Create offline payment failed:', error);
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async listPayments() {
        try {
            const jsonData = await this.apiService.get(`${this.baseEndpoint}payments/`);
            return jsonData?.data || jsonData;
        } catch (error) {
            console.error('List payments failed:', error);
            ApiErrorHandler.handle(error, this.notificationService);
            throw error;
        }
    }

    async getMemberships(params = {}) {
        return this.getList(params);
    }

    async getMembership(membershipId) {
        return this.getItem(membershipId);
    }
}