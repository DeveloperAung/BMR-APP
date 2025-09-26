import { BaseManager } from '../../../shared/managers/BaseManager.js';
import { PostRepository } from '../repositories/PostRepository.js';
import { PostTableRenderer } from '../renderers/PostTableRenderer.js';
import { PostFilterHandler } from "../handlers/PostFilterHandler.js";

export class PostManager extends BaseManager {
    constructor({ authService, notificationService }) {
        const repository = new PostRepository({ notificationService });
        const tableRenderer = new PostTableRenderer();
        const filterHandler = new PostFilterHandler();

        super({
            authService,
            notificationService,
            repository,
            tableRenderer,
            filterHandler,

             getItemsFn: async (params) => {
                console.log('[PostManager] Loading posts with params:', params);
                const res = await repository.getPosts(params);
                console.log('[PostManager] Raw response from repository.getPosts:', res);
                return res;
              },
            extractItemsFn: (response) => response.posts || response.items || [],

            itemType: 'posts',

            defaultPerPage: 30,
            defaultFilters: {
                ordering: '-published_at'
            }
        });

        this.filterHandler = new PostFilterHandler(this.handleFiltersChange.bind(this));
    }

    async createPost(postData) {
        this.notificationService?.showLoading?.('Creating post...');
        const response = await this.repository.submitPost(postData);
        this.notificationService?.hideLoading?.();
        return response;
    }

    async updatePost(postId, postData) {
        console.log("calling post update", postData)
        this.notificationService?.showLoading?.('Updating post...');
        const response = await this.repository.updatePost(postId, postData);
        this.notificationService?.hideLoading?.();
        return response;
    }

    async viewPost(Id) {
        console.log(`Viewing category ${Id}`);
        window.location.href = `/posts/i/posts/${Id}/`;
    }

    async editPost(Id) {
        console.log(`Editing category ${Id}`);
        window.location.href = `/posts/i/posts/${Id}/edit/`;
    }
}
