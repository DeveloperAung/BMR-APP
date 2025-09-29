import { MembershipManager } from './managers/MembershipManager.js';
import { NotificationService } from '../shared/services/NotificationService.js';
import { AuthService } from '../shared/services/AuthService.js';

class AssociationApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.usersManager = null;
    }

    async init() {
        try {
            const isAuthenticated = await this.authService.isAuthenticated();
            console.warn('authentication check', isAuthenticated);
            if (!isAuthenticated) {
                console.warn('❌ User not authenticated');
                this.redirectToLogin('Authentication required');
                return;
            }

            // Initialize users manager
            this.associationManager = new MembershipManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.associationManager.init();
        } catch (error) {
            this.notificationService.showError('Failed to initialize dashboard', error);
        }
    }

    showLoginRequired() {
        document.getElementById('postsTableBody').innerHTML = `
            <tr><td colspan="8" class="text-center p-4">
                <div class="alert alert-warning">
                    <h4>Authentication Required</h4>
                    <p>Please log in to access association post management.</p>
                    <a href="/login/" class="btn btn-primary">Go to Login</a>
                </div>
            </td></tr>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AssociationApp();

    // Test util
    window.testUserLoad = async function () {
        console.log('🧪 Testing association load...');
        try {
            const tbody = document.getElementById('postsTableBody');
            const spinner = document.getElementById('loadingSpinner');
            console.log('DOM Elements:', { tbody: !!tbody, spinner: !!spinner });

            const token = localStorage.getItem('access_token');
            console.log('Token present:', !!token);

            const response = await fetch('/api/association/posts/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const responseData = await response.json();
                const assoPosts = responseData?.data?.results;

                if (tbody && Array.isArray(assoPosts)) {
                    tbody.innerHTML = assoPosts.map(assoPost => `
                        <tr>
                            <td colspan="7">${assoPost.title || 'Unknown Title'}</td>
                        </tr>
                    `).join('');
                } else {
                    console.warn('❌ No post found in response:', responseData);
                }
            } else {
                console.error('API Error:', await response.text());
            }

        } catch (error) {
            console.error('Test failed:', error);
        }
    };

    // Run test and init app
    window.testUserLoad();
    app.init();
});
