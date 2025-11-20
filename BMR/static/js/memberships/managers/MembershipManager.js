// static/js/memberships/managers/MembershipManager.js
import { MembershipRepository } from '../repositories/MembershipRepository.js';
import {BaseManager} from "../../shared/managers/BaseManager.js";
import {MembershipTableRenderer} from "../renderers/MembershipTableRenderer.js";
import {MembershipFilterHandler} from "../handlers/FilterHandler.js";

export class MembershipManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new MembershipRepository({ notificationService });
        const tableRenderer = new MembershipTableRenderer();
        const filterHandler = new MembershipFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,

             getItemsFn: async (params) => {
                console.log("before call repo")
                const res = await repository.getMemberships(params);
                console.log("result", res)
                console.log('[MembershipManager] Raw response from repository.getMemberships:', res);
                return res;
              },
            extractItemsFn: (response) => response || response.items || [],

            itemType: 'memberships',

            defaultPerPage: 30,
            defaultFilters: {
                ordering: '-published_at',
                status_code: '12'
            }
        });

        this.filterHandler = new MembershipFilterHandler(this.handleFiltersChange.bind(this));
    }

    async submitPage1(pageData) {
        this.notificationService?.showLoading?.('Creating membership step 1...');
        try {
            const response = await this.repository.submitPage1(pageData, true);
            return response;
        } finally {
            this.notificationService?.hideLoading?.();
        }
    }

    async submitPage2(data) {
        this.notificationService?.showLoading?.('Submitting application...');
        try {
            const response = await this.repository.submitPage2(data);
            return response;
        } finally {
            this.notificationService?.hideLoading?.();
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
            try {
                const response = await this.repository.createOnlinePayment(data);
                return response;
            } finally {
                this.notificationService?.hideLoading?.();
            }
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async createOfflinePayment(data) {
        try {
            this.notificationService?.showLoading?.('Recording payment...');
            try {
                const response = await this.repository.createOfflinePayment(data);
                return response;
            } finally {
                this.notificationService?.hideLoading?.();
            }
        } catch (error) {
            this.notificationService?.hideLoading?.();
            throw error;
        }
    }

    async workflowDecision(uuid, data) {
        try {
            this.notificationService?.showLoading?.('Updating membership...');
            try {
                const response = await this.repository.workflowDecision(uuid, data);
                return response;
            } finally {
                this.notificationService?.hideLoading?.();
            }
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

    async viewMembership(id) {
        console.log(`Viewing membership ${id}`);
        window.location.href = `/memberships/i/approval/${id}/`;
    }

    async editMembership(id) {
        console.log(`Editing category ${id}`);
        window.location.href = `/memberships/i/categories/${id}/edit/`;
    }
}
