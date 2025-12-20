import { refreshToken, logout } from "./auth.js";

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve(token);
    });

    failedQueue = [];
}

export async function apiRequest(url, options = {}) {
    let access = localStorage.getItem("access");

    const headers = {
        "Content-Type": "application/json",
        ...(access ? { Authorization: `Bearer ${access}` } : {})
    };

    const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : null,
    });

    // Normal successful response
    if (response.status !== 401) return await response.json();

    // 401 Unauthorized → Try refresh token
    if (!localStorage.getItem("refresh")) {
        logout();
        return;
    }

    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        }).then((token) => {
            headers["Authorization"] = `Bearer ${token}`;
            return fetch(url, { ...options, headers }).then(r => r.json());
        });
    }

    isRefreshing = true;

    try {
        const tokenData = await refreshToken();

        isRefreshing = false;
        processQueue(null, tokenData.access);

        headers["Authorization"] = `Bearer ${tokenData.access}`;
        return fetch(url, { ...options, headers }).then(r => r.json());

    } catch (err) {
        isRefreshing = false;
        processQueue(err, null);
        logout();
    }
}