// static/js/users/handlers/BulkActionHandler.js
export class BulkActionHandler {
    constructor() {
        this.selectedUsers = new Set();
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.createBulkActionsContainer();
    }

    cacheElements() {
        this.elements = {
            masterCheckbox: document.getElementById('masterCheckbox'),
            bulkActions: document.getElementById('bulkActions'),
            usersTableBody: document.getElementById('usersTableBody')
        };
    }

    createBulkActionsContainer() {
        if (this.elements.bulkActions) return;

        const container = document.createElement('div');
        container.id = 'bulkActions';
        container.className = 'bulk-actions';
        container.style.display = 'none';

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong class="selected-count">0 users selected</strong>
                </div>
                <div class="bulk-action-buttons">
                    <button class="btn btn-sm btn-outline-primary" data-action="bulk-export">
                        <i class="fa fa-download"></i> Export Selected
                    </button>
                    <button class="btn btn-sm btn-outline-warning" data-action="bulk-activate">
                        <i class="fa fa-check"></i> Activate
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" data-action="bulk-deactivate">
                        <i class="fa fa-times"></i> Deactivate
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-action="bulk-delete">
                        <i class="fa fa-trash"></i> Delete Selected
                    </button>
                </div>
            </div>
        `;

        // Insert before the table
        const tableContainer = document.querySelector('.list-product');
        if (tableContainer) {
            tableContainer.parentNode.insertBefore(container, tableContainer);
        }

        this.elements.bulkActions = container;
    }

    setupEventListeners() {
        // Master checkbox
        if (this.elements.masterCheckbox) {
            this.elements.masterCheckbox.addEventListener('change', (e) => {
                this.handleMasterCheckboxChange(e.target.checked);
            });
        }

        // Individual checkboxes (delegated event)
        if (this.elements.usersTableBody) {
            this.elements.usersTableBody.addEventListener('change', (e) => {
                if (e.target.matches('.user-checkbox')) {
                    this.handleUserCheckboxChange(e.target);
                }
            });
        }

        // Bulk action buttons
        if (this.elements.bulkActions) {
            this.elements.bulkActions.addEventListener('click', (e) => {
                if (e.target.matches('[data-action]')) {
                    this.handleBulkAction(e.target.dataset.action);
                }
            });
        }
    }

    handleMasterCheckboxChange(isChecked) {
        const userCheckboxes = document.querySelectorAll('.user-checkbox');

        userCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            if (isChecked) {
                this.selectedUsers.add(checkbox.value);
            } else {
                this.selectedUsers.delete(checkbox.value);
            }
        });

        this.updateBulkActionsDisplay();
    }

    handleUserCheckboxChange(checkbox) {
        if (checkbox.checked) {
            this.selectedUsers.add(checkbox.value);
        } else {
            this.selectedUsers.delete(checkbox.value);
        }

        this.updateMasterCheckbox();
        this.updateBulkActionsDisplay();
    }

    updateMasterCheckbox() {
        if (!this.elements.masterCheckbox) return;

        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        const checkedCount = document.querySelectorAll('.user-checkbox:checked').length;
        const totalCount = userCheckboxes.length;

        if (checkedCount === 0) {
            this.elements.masterCheckbox.checked = false;
            this.elements.masterCheckbox.indeterminate = false;
        } else if (checkedCount === totalCount) {
            this.elements.masterCheckbox.checked = true;
            this.elements.masterCheckbox.indeterminate = false;
        } else {
            this.elements.masterCheckbox.checked = false;
            this.elements.masterCheckbox.indeterminate = true;
        }
    }

    updateBulkActionsDisplay() {
        if (!this.elements.bulkActions) return;

        const selectedCount = this.selectedUsers.size;
        const countElement = this.elements.bulkActions.querySelector('.selected-count');

        if (selectedCount > 0) {
            this.elements.bulkActions.style.display = 'block';
            if (countElement) {
                countElement.textContent = `${selectedCount} user${selectedCount > 1 ? 's' : ''} selected`;
            }
        } else {
            this.elements.bulkActions.style.display = 'none';
        }
    }

    handleBulkAction(action) {
        const selectedIds = Array.from(this.selectedUsers);

        if (selectedIds.length === 0) {
            alert('Please select users first.');
            return;
        }

        switch (action) {
            case 'bulk-export':
                this.exportUsers(selectedIds);
                break;
            case 'bulk-activate':
                this.bulkActivateUsers(selectedIds);
                break;
            case 'bulk-deactivate':
                this.bulkDeactivateUsers(selectedIds);
                break;
            case 'bulk-delete':
                this.bulkDeleteUsers(selectedIds);
                break;
        }
    }

    async exportUsers(userIds) {
        try {
            // Create CSV content
            const users = this.getSelectedUserData(userIds);
            const csv = this.convertToCSV(users);
            this.downloadCSV(csv, 'selected_users.csv');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    }

    async bulkActivateUsers(userIds) {
        if (!confirm(`Activate ${userIds.length} selected users?`)) return;

        console.log('Bulk activate users:', userIds);
        // TODO: Implement API call
        alert('Bulk activate feature will be implemented soon.');
    }

    async bulkDeactivateUsers(userIds) {
        if (!confirm(`Deactivate ${userIds.length} selected users?`)) return;

        console.log('Bulk deactivate users:', userIds);
        // TODO: Implement API call
        alert('Bulk deactivate feature will be implemented soon.');
    }

    async bulkDeleteUsers(userIds) {
        if (!confirm(`Delete ${userIds.length} selected users? This action cannot be undone.`)) return;

        console.log('Bulk delete users:', userIds);
        // TODO: Implement API call
        alert('Bulk delete feature will be implemented soon.');
    }

    getSelectedUserData(userIds) {
        const users = [];
        userIds.forEach(userId => {
            const row = document.querySelector(`tr[data-user-id="${userId}"]`);
            if (row) {
                // Extract data from table row
                const cells = row.querySelectorAll('td');
                users.push({
                    id: userId,
                    name: cells[1]?.textContent.trim() || '',
                    email: cells[2]?.textContent.trim() || '',
                    username: cells[3]?.textContent.trim() || '',
                    role: cells[4]?.textContent.trim() || '',
                    status: cells[5]?.textContent.trim() || '',
                    joinDate: cells[6]?.textContent.trim() || ''
                });
            }
        });
        return users;
    }

    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header =>
                    `"${(row[header] || '').toString().replace(/"/g, '""')}"`
                ).join(',')
            )
        ].join('\n');

        return csvContent;
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    clearSelection() {
        this.selectedUsers.clear();

        // Uncheck all checkboxes
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        if (this.elements.masterCheckbox) {
            this.elements.masterCheckbox.checked = false;
            this.elements.masterCheckbox.indeterminate = false;
        }

        this.updateBulkActionsDisplay();
    }

    getSelectedUserIds() {
        return Array.from(this.selectedUsers);
    }
}