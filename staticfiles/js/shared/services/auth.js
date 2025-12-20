import { apiRequest } from "./api.js";

export async function login(username, password) {
    return await apiRequest("/api/auth/login/", {
        method: "POST",
        body: { username, password }
    });
}

export async function googleLogin(idToken) {
    return await apiRequest("/api/auth/google/", {
        method: "POST",
        body: { id_token: idToken }
    });
}

export async function refreshToken() {
    const refresh = localStorage.getItem("refresh");

    const res = await fetch("/api/auth/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh })
    });

    const data = await res.json();

    if (data.access) {
        localStorage.setItem("access", data.access);
        return data;
    } else {
        logout();
        return null;
    }
}

export function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login/";
}

// export async function logoutAll() {
//     return await apiRequest("/api/v1/user/auth/logout-all/", { method: "POST" });
// }