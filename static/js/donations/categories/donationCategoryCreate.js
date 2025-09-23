import { DonationCategoryRepository } from '../../BMR/static/js/donations/categories/repositories/DonationCategoryRepository.js';

export class DonationCategoryCreate {
    constructor() {
        console.log('Initializing DonationCategoryCreate...');
        try {
            this.repository = new DonationCategoryRepository();
            this.form = document.getElementById('categoryForm');
            this.resultDiv = document.getElementById('result');
            
            console.log('Form element:', this.form);
            console.log('Result div:', this.resultDiv);
            
            if (!this.form) {
                console.error('Could not find form with ID "categoryForm"');
                return;
            }
            
            this.initializeEventListeners();
            console.log('Event listeners initialized');
        } catch (error) {
            console.error('Error initializing DonationCategoryCreate:', error);
        }
    }

    initializeEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(event) {
        console.log('Form submitted');
        event.preventDefault();
        
        console.log('Form data:', {
            title: document.getElementById('title')?.value,
            is_date_required: document.getElementById('is_date_required')?.checked,
            is_multi_select_required: document.getElementById('is_multi_select_required')?.checked
        });
        
        const formData = {
            title: document.getElementById('title').value.trim(),
            is_date_required: document.getElementById('is_date_required').checked,
            is_multi_select_required: document.getElementById('is_multi_select_required').checked
        };

        // Validate form
        if (!formData.title) {
            this.showResult('Category title is required', 'danger');
            return;
        }

        try {
            const result = await this.repository.createCategory(formData);
            this.showResult('Category created successfully!', 'success');
            
            // Redirect to list page after 1.5 seconds
            setTimeout(() => {
                window.location.href = '/donations/categories/';
            }, 1500);
            
            this.form.reset();
        } catch (error) {
            console.error('Error creating category:', error);
            const errorMessage = error.message || 'Failed to create category';
            this.showResult(errorMessage, 'danger');
        }
    }

    showResult(message, type = 'info') {
        this.resultDiv.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DonationCategoryCreate();
});
