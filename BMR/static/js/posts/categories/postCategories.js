import { CategoryManager } from './managers/CategoryManager.js';
import { AuthService } from '../../shared/services/AuthService.js';
import { NotificationService } from '../../shared/services/NotificationService.js';

class CategoryApp {
    constructor() {
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        this.categoryManager = null;
    }

    async init() {
        try {
            // TEMP BYPASS: Disable auth check during development
            // REMOVE THIS BEFORE PRODUCTION
            console.warn('⚠️ Auth check bypassed for development');
            // if (!await this.authService.isAuthenticated()) {
            //     this.showLoginRequired();
            //     return;
            // }

            // Initialize category manager
            this.categoryManager = new CategoryManager({
                authService: this.authService,
                notificationService: this.notificationService
            });

            await this.categoryManager.init();
        } catch (error) {
            this.notificationService.showError('Failed to initialize category management', error);
        }
    }

    showLoginRequired() {
        document.getElementById('postCategoriesTableBody').innerHTML = `
            <tr><td colspan="5" class="text-center p-4">
                <div class="alert alert-warning">
                    <h4>Authentication Required</h4>
                    <p>Please log in to access category management.</p>
                    <a href="/login/" class="btn btn-primary">Go to Login</a>
                </div>
            </td></tr>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new CategoryApp();

    // Test util
    window.testCategoryLoad = async function () {
        console.log('🧪 Testing category load...');
        try {
            const tbody = document.getElementById('postCategoriesTableBody');
            const spinner = document.getElementById('loadingSpinner');
            console.log('DOM Elements:', { tbody: !!tbody, spinner: !!spinner });

            const token = localStorage.getItem('access_token');
            console.log('Token present:', !!token);

            const response = await fetch('/api/posts/categories/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const responseData = await response.json();
                const categories = responseData?.data?.results;

                if (tbody && Array.isArray(categories)) {
                    tbody.innerHTML = categories.map(category => `
                        <tr>
                            <td colspan="5">${category.title || 'Unknown Category'}</td>
                        </tr>
                    `).join('');
                } else {
                    console.warn('❌ No categories found in response:', responseData);
                }
            } else {
                console.error('API Error:', await response.text());
            }

        } catch (error) {
            console.error('Test failed:', error);
        }
    };

    // Run test and init app
    //    window.testCategoryLoad();
    app.init();
});