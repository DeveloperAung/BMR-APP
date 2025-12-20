import { RoleRepository } from '../repositories/roleRepository.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

export class RoleFormHandler {
    constructor(form, { authService, notificationService } = {}) {
        if (!form) {
            throw new Error('Form element is required');
        }

        this.form = form;
        this.notificationService = notificationService || new NotificationService();
        this.roleRepository = new RoleRepository({ notificationService: this.notificationService });
        this.roleId = this.form.dataset.roleId || null;
        
        this.initialize();
    }

    initialize() {
        this.bindEvents();
        if (this.roleId) {
            this.loadRoleData();
        }
    }

    bindEvents() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Add event listener for permission checkboxes if they exist
        const permissionCheckboxes = this.form.querySelectorAll('input[type="checkbox"][name="permissions"]');
        permissionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.handlePermissionChange.bind(this));
        });
    }

    async loadRoleData() {
        try {
            const roleData = await this.roleRepository.getRoleWithPermissions(this.roleId);
            this.populateForm(roleData);
        } catch (error) {
            console.error('Error loading role data:', error);
            this.notificationService.showError('Failed to load role data');
        }
    }

    populateForm(roleData) {
        // Set role name
        const nameInput = this.form.querySelector('[name="name"]');
        if (nameInput) nameInput.value = roleData.name || '';

        // Set permissions
        if (roleData.permissions) {
            const permissionCheckboxes = this.form.querySelectorAll('input[type="checkbox"][name="permissions"]');
            permissionCheckboxes.forEach(checkbox => {
                const hasPermission = roleData.permissions.some(
                    perm => perm.id === parseInt(checkbox.value) || perm === parseInt(checkbox.value)
                );
                checkbox.checked = hasPermission;
            });
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        const permissions = [];
        
        // Get all checked permission checkboxes
        const permissionCheckboxes = this.form.querySelectorAll('input[type="checkbox"][name="permissions"]:checked');
        permissionCheckboxes.forEach(checkbox => {
            permissions.push(parseInt(checkbox.value));
        });

        return {
            name: formData.get('name'),
            permissions: permissions
        };
    }

    validateForm(formData) {
        if (!formData.name || formData.name.trim() === '') {
            throw new Error('Role name is required');
        }
        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = this.getFormData();
            this.validateForm(formData);
            
            if (this.roleId) {
                await this.roleRepository.updateRole(this.roleId, formData);
                this.notificationService.showSuccess('Role updated successfully');
            } else {
                await this.roleRepository.createRole(formData);
                this.notificationService.showSuccess('Role created successfully');
                this.form.reset();
            }
            
            // Optional: Redirect or update UI as needed
            setTimeout(() => {
                window.location.href = '/i/roles/list/';
            }, 1500);
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.notificationService.showError(error.message || 'Failed to save role');
        }
    }

    handlePermissionChange(e) {
        // Handle permission changes if needed
        console.log('Permission changed:', e.target.value, e.target.checked);
    }
}
