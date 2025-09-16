// static/js/users/components/UserModal.js

// Helper functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

export function showUserModal(user) {
    console.log('showUserModal called with:', user);
    console.log('User email:', user.email); // Changed from user.data.email

    // Create modal if it doesn't exist
    let modal = document.getElementById('userViewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'userViewModal';
        modal.className = 'modal fade';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
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
        document.body.appendChild(modal);
    }

    // Format user data for display - REMOVED .data from all references
    const fullName = user.email || user.username || 'N/A';
    const userEmail = user.email || 'N/A';
    const userMobile = user.mobile || 'N/A';
    const userSecondaryMobile = user.secondary_mobile || 'N/A';
    const profilePicture = user.profile_picture || '/static/assets/images/user/1.jpg';
    const userRole = user.is_superuser ? 'Super Admin' : user.is_staff ? 'Staff' : 'User';
    const userStatus = user.is_active;
    const userVerified = user.is_email_verified;
    const loginMethod = user.is_google_login ? 'Google' : 'Email/Password';
    const lastLogin = user.last_login ? formatDate(user.last_login) : '-';
    const dateJoined = formatDate(user.date_joined);

    const userDetails = `
        <div class="row">
            <!-- Left Column -->
            <div class="col-xl-4">
                <div class="card h-100">
                    <div class="card-header card-no-border pb-0">
                        <div class="card-options">
                            <a class="card-options-collapse" href="#" data-bs-toggle="card-collapse">
                                <i class="fe fe-chevron-up"></i>
                            </a>
                            <a class="card-options-remove" href="#" data-bs-dismiss="modal">
                                <i class="fe fe-x"></i>
                            </a>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-4">
                            <img class="img-100 rounded-circle mb-3" 
                                 src="${profilePicture}"
                                 alt="Profile"
                                 onerror="this.src='/static/assets/images/user/1.jpg'"
                                 style="width: 100px; height: 100px; object-fit: cover;">
                            <h3 class="mb-1">${escapeHtml(fullName)}</h3>
                            <p class="text-uppercase text-muted"><i class="badge rounded-pill badge-primary">${userRole}</i> </p>
                            <span class="badge badge-pill ${userStatus ? 'bg-success' : 'bg-danger'}">
                                ${userStatus ? 'Active' : 'Inactive'}
                            </span>
                            <span class="mt-2 badge badge-pill ${userVerified ? 'bg-success' : 'bg-danger'}">
                                ${userVerified ? 'Verified' : 'Email Not Verified'}
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
                            <input class="form-control" value="${escapeHtml(user.username || 'N/A')}" readonly>                                
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <div class="input-group">
                                <input class="form-control" value="${escapeHtml(userEmail)}" readonly>
                                <span class="input-group-text">
                                    <i class="fa ${userVerified ? 'fa-check-circle text-success' : 'fa-exclamation-circle text-warning'}" 
                                       title="${userVerified ? 'Email Verified' : 'Email Not Verified'}"></i>
                                </span>
                            </div>
                        </div>  

                        <div class="mb-3">
                            <label class="form-label">Mobile</label>
                            <input class="form-control" value="${escapeHtml(userMobile)}" readonly>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Secondary Mobile</label>
                            <input class="form-control" value="${escapeHtml(userSecondaryMobile)}" readonly>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Login Method</label>
                            <div class="input-group">
                                <input class="form-control" value="${loginMethod}" readonly>
                                <span class="input-group-text">
                                    ${user.data.is_google_login ? 
                                        '<i class="fa fa-google text-danger"></i>' : 
                                        '<i class="fa fa-envelope text-primary"></i>'}
                                </span>
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Last Login</label>
                                <input class="form-control" 
                                       value="${lastLogin}" 
                                       readonly>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Date Joined</label>
                                <input class="form-control" 
                                       value="${dateJoined}" 
                                       readonly>
                            </div>
                        </div>                            
                    </div>
                </div>
            </div>
        </div>
    `;

    // Update modal content
    content.innerHTML = userDetails;
    console.log('Modal content updated successfully');

    // Show the modal
    try {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        console.log('Modal shown successfully');
    } catch (error) {
        console.error('Error showing modal:', error);
    }
}