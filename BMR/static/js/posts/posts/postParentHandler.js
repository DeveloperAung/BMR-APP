import { ApiService } from '../../shared/services/ApiService.js';

export class PostParentHandler {
    constructor(apiBaseUrl) {
        this.apiService = new ApiService(apiBaseUrl);
        this.categorySelect = document.getElementById('id_post_category');
        this.parentSelect = document.getElementById('id_parent');
        this.initialized = false;
        
        if (this.categorySelect && this.parentSelect) {
            this.initialize();
        }
    }

    initialize() {
        if (this.initialized) return;
        
        // Store the initial parent value if in edit mode
        this.initialParentId = this.parentSelect.value;
        
        // Add event listener for category change
        this.categorySelect.addEventListener('change', this.handleCategoryChange.bind(this));
        
        // Trigger initial load if a category is already selected
        if (this.categorySelect.value) {
            this.loadParentPosts(this.categorySelect.value);
        }
        
        this.initialized = true;
    }

    async handleCategoryChange(event) {
        const categoryId = event.target.value;
        this.parentSelect.disabled = true;
        
        // Clear existing options except the first one
        while (this.parentSelect.options.length > 1) {
            this.parentSelect.remove(1);
        }
        
        if (categoryId) {
            await this.loadParentPosts(categoryId);
        } else {
            this.parentSelect.disabled = false;
        }
    }

    async loadParentPosts(categoryId) {
        try {
            // Show loading state
            const loadingOption = document.createElement('option');
            loadingOption.value = '';
            loadingOption.textContent = 'Loading...';
            loadingOption.disabled = true;
            this.parentSelect.appendChild(loadingOption);
            this.parentSelect.disabled = true;
            
            // Fetch posts by category
            const response = await this.apiService.get(`/api/posts/by-category/${categoryId}/`);
            
            // Clear loading option
            this.parentSelect.innerHTML = '<option value="">-- Select Parent Post --</option>';
            
            if (response && response.length > 0) {
                // Add fetched posts to the select
                response.forEach(post => {
                    // Skip the current post if we're in edit mode
                    const currentPostId = this.parentSelect.dataset.currentPostId;
                    if (currentPostId && post.id === parseInt(currentPostId)) {
                        return;
                    }
                    
                    const option = document.createElement('option');
                    option.value = post.id;
                    option.textContent = post.title;
                    this.parentSelect.appendChild(option);
                });
                
                // Restore the initial value if it exists and is valid
                if (this.initialParentId) {
                    const optionExists = Array.from(this.parentSelect.options).some(
                        opt => opt.value === this.initialParentId
                    );
                    
                    if (optionExists) {
                        this.parentSelect.value = this.initialParentId;
                    }
                    this.initialParentId = null; // Reset after first use
                }
            } else {
                const noPostsOption = document.createElement('option');
                noPostsOption.value = '';
                noPostsOption.textContent = 'No parent posts available';
                noPostsOption.disabled = true;
                this.parentSelect.appendChild(noPostsOption);
            }
            
            this.parentSelect.disabled = false;
        } catch (error) {
            console.error('Error loading parent posts:', error);
            
            // Clear and show error
            this.parentSelect.innerHTML = '';
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = 'Error loading posts';
            errorOption.disabled = true;
            this.parentSelect.appendChild(errorOption);
            this.parentSelect.disabled = false;
        }
    }
}

// Auto-initialize if this file is loaded directly
if (typeof document !== 'undefined' && document.readyState !== 'loading') {
    const API_BASE_URL = window.API_BASE_URL || '/api';
    new PostParentHandler(API_BASE_URL);
}
