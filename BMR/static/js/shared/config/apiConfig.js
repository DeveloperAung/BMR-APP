const BASE_API_URL = '/api';

// API Endpoints organized by modules
export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: `${BASE_API_URL}/auth/login/`,
        LOGOUT: `${BASE_API_URL}/auth/logout/`,
        REFRESH: `${BASE_API_URL}/auth/refresh/`,
        USER_PROFILE: `${BASE_API_URL}/auth/profile/`
    },

    // Events
    EVENTS: {
        CATEGORIES: `${BASE_API_URL}/events/categories/`,
        SUB_CATEGORIES: `${BASE_API_URL}/events/subcategories/`,
        EVENTS: `${BASE_API_URL}/events/`,
        EVENT_DATES: `${BASE_API_URL}/events/dates/`
    },

    // Posts
    POSTS: {
        CATEGORIES: `${BASE_API_URL}/posts/categories/`,
        POSTS: `${BASE_API_URL}/posts/`,
        TAGS: `${BASE_API_URL}/posts/tags/`
    },

    // Donations
    DONATIONS: {
        CATEGORIES: `${BASE_API_URL}/donations/categories/`,
        SUB_CATEGORIES: `${BASE_API_URL}/donations/subcategories/`,
        DONATIONS: `${BASE_API_URL}/donations/`,
        CAMPAIGNS: `${BASE_API_URL}/donations/campaigns/`
    },

    // Users
    USERS: {
        USERS: `${BASE_API_URL}/auth/users/`,
        ROLES: `${BASE_API_URL}/users/roles/`,
        PERMISSIONS: `${BASE_API_URL}/users/permissions/`
    },

    // Core/Common
    CORE: {
        NOTIFICATIONS: `${BASE_API_URL}/core/notifications/`,
        SETTINGS: `${BASE_API_URL}/core/settings/`,
        UPLOADS: `${BASE_API_URL}/core/uploads/`
    },

    ASSOCIATION: {
        POSTS: `${BASE_API_URL}/association/posts`
    },

    MEMBERSHIP: {
        MEMBERSHIPS: `${BASE_API_URL}/membership/`,
        SUBMIT_PAGE1: `${BASE_API_URL}/membership/submit-page1/`
    }
};

/**
 * Helper function to get endpoint with ID
 * @param {string} baseEndpoint - Base endpoint URL
 * @param {number|string} id - Resource ID
 * @returns {string} Complete endpoint URL
 */
export const getEndpointWithId = (baseEndpoint, id) => {
    return `${baseEndpoint}${id}/`;
};

/**
 * Helper function to build query parameters
 * @param {Object} params - Query parameters object
 * @returns {string} Query string
 */
export const buildQueryString = (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            searchParams.append(key, value);
        }
    });
    return searchParams.toString();
};


export const API_CONFIG = {
    BASE_URL: BASE_API_URL,
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    ITEMS_PER_PAGE: {
        DEFAULT: 30,
        OPTIONS: [10, 30, 50, 100]
    }
};

export const {
    AUTH,
    EVENTS,
    POSTS,
    DONATIONS,
    USERS,
    CORE,
    ASSOCIATION,
    MEMBERSHIP
} = API_ENDPOINTS;