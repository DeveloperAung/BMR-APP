class UserProfile {
    constructor(userData) {
        this.user = userData;
        this.modalId = 'userViewModal';
        this.initModal();
    }

    /**
     * Initialize the modal if it doesn't exist
     */
    initModal() {
        if (!document.getElementById(this.modalId)) {
            const modal = document.createElement('div');
            modal.id = this.modalId;
            modal.className = 'modal fade';
            modal.tabIndex = '-1';
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = this.getModalTemplate();
            document.body.appendChild(modal);
        }
    }

    /**
     * Get the modal HTML template
     */
    getModalTemplate() {
        return `
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">User Profile</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0" id="userDetailsContent">
                        <!-- Content will be populated by JavaScript -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format date to a readable format
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get the user role badge
     */
    getUserRole() {
        if (this.user.is_superuser) return 'Super Admin';
        if (this.user.is_staff) return 'Staff';
        return 'User';
    }

    /**
     * Get the login method
     */
    getLoginMethod() {
        return this.user.is_google_login ? 'Google' : 'Email/Password';
    }

    /**
     * Render the user profile
     */
    render() {
        const user = this.user;
        const userRole = this.getUserRole();
        const loginMethod = this.getLoginMethod();

        const template = `
            <div class="row">
                <!-- Left Column -->
                <div class="col-xl-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <img class="img-100 rounded-circle mb-3" 
                                 src="${user.profile_picture || '/static/assets/images/user/1.jpg'}"
                                 alt="Profile"
                                 onerror="this.src='/static/assets/images/user/1.jpg'"
                                 style="width: 100px; height: 100px; object-fit: cover;">
                            <h4 class="mb-1">${this.escapeHtml(user.email)}</h4>
                            <p class="text-uppercase text-muted">
                                <span class="badge rounded-pill bg-primary">${userRole}</span>
                            </p>
                            <div class="d-flex justify-content-center gap-2 mb-3">
                                <span class="badge rounded-pill ${user.is_active ? 'bg-success' : 'bg-danger'}">
                                    ${user.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <span class="badge rounded-pill ${user.is_email_verified ? 'bg-success' : 'bg-danger'}">
                                    ${user.is_email_verified ? 'Verified' : 'Not Verified'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column -->
                <div class="col-xl-8">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="mb-3">                                
                                <label class="form-label">Username</label>
                                <input class="form-control" value="${this.escapeHtml(user.username || 'N/A')}" readonly>                                
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <div class="input-group">
                                    <input class="form-control" value="${this.escapeHtml(user.email || 'N/A')}" readonly>
                                    <span class="input-group-text">
                                        <i class="fa ${user.is_email_verified ? 'fa-check-circle text-success' : 'fa-exclamation-circle text-warning'}" 
                                           title="${user.is_email_verified ? 'Email Verified' : 'Email Not Verified'}"></i>
                                    </span>
                                </div>
                            </div>  

                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Mobile</label>
                                    <input class="form-control" value="${this.escapeHtml(user.mobile || 'N/A')}" readonly>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Secondary Mobile</label>
                                    <input class="form-control" value="${this.escapeHtml(user.secondary_mobile || 'N/A')}" readonly>
                                </div>
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Login Method</label>
                                    <div class="input-group">
                                        <input class="form-control" value="${loginMethod}" readonly>
                                        <span class="input-group-text">
                                            ${user.is_google_login ? 
                                                '<i class="fa fa-google text-danger"></i>' : 
                                                '<i class="fa fa-envelope text-primary"></i>'}
                                        </span>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Account Type</label>
                                    <input class="form-control" value="${userRole}" readonly>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <label class="form-label">Last Login</label>
                                    <input class="form-control" 
                                           value="${this.formatDate(user.last_login)}" 
                                           readonly>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Date Joined</label>
                                    <input class="form-control" 
                                           value="${this.formatDate(user.date_joined)}" 
                                           readonly>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const content = document.querySelector(`#${this.modalId} #userDetailsContent`);
        if (content) {
            content.innerHTML = template;
        }

        return this;
    }

    /**
     * Show the modal
     */
    show() {
        this.render();
        const modalElement = document.getElementById(this.modalId);
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
        return this;
    }
}

// Make it available globally
window.UserProfile = UserProfile;

// Make it available globally if needed
window.UserProfile = UserProfile;
