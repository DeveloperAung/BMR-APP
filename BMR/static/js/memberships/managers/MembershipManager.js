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
                ordering: '-published_at'
            }
        });

        this.filterHandler = new MembershipFilterHandler(this.handleFiltersChange.bind(this));
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

    async viewMembership(id) {
        console.log(`Viewing membership ${id}`);
        window.location.href = `/memberships/i/approval/${id}/`;
    }

    async editMembership(id) {
        console.log(`Editing category ${id}`);
        window.location.href = `/memberships/i/categories/${id}/edit/`;
    }
}