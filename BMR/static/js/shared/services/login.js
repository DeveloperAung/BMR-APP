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

// Run AFTER everything is loaded (fixes missing elements)
window.onload = () => {

    // --------------------------
    // AUTO REDIRECT IF LOGGED IN
    // --------------------------
    async function checkAlreadyLoggedIn() {
        const access = localStorage.getItem("access");
        const refresh = localStorage.getItem("refresh");

        if (!access && !refresh) return;

        if (access) {
            window.location.href = "/";
            return;
        }

        if (refresh) {
            try {
                const newToken = await refreshToken();
                if (newToken?.access) {
                    window.location.href = "/";
                }
            } catch (e) {
                console.warn("Token refresh failed");
            }
        }
    }

    checkAlreadyLoggedIn();


    // --------------------------
    // NORMAL LOGIN BUTTON
    // --------------------------
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            try {
                const result = await login(username, password);
                if (!result?.access) {
                    alert("Invalid username/password");
                    return;
                }

                localStorage.setItem("access", result.access);
                localStorage.setItem("refresh", result.refresh);

                redirectAfterLogin();
            } catch (e) {
                console.error(e);
                alert("Login failed");
            }
        });
    }


    // --------------------------
    // REDIRECT AFTER LOGIN
    // --------------------------
    function redirectAfterLogin() {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");

        if (next && next !== "/login/" && next !== "/") {
            window.location.href = next;
        } else {
            window.location.href = "/";
        }
    }


    // --------------------------
    // GOOGLE LOGIN
    // --------------------------
    function handleGoogleCallback(res) {
        googleLogin(res.credential)
            .then(result => {
                if (!result?.data?.access) {
                    alert("Google login failed");
                    return;
                }

                localStorage.setItem("access", result.data.access);
                localStorage.setItem("refresh", result.data.refresh);

                redirectAfterLogin();
            })
            .catch(console.error);
    }


    // --------------------------
    // RENDER GOOGLE BUTTON
    // --------------------------
    function initGoogleLogin() {
        if (!window.google?.accounts?.id) {
            return setTimeout(initGoogleLogin, 200);
        }

        window.google.accounts.id.initialize({
            client_id: window.GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false,
        });

        const googleDiv = document.getElementById("googleButton");
        if (googleDiv) {
            window.google.accounts.id.renderButton(googleDiv, {
                theme: "outline",
                size: "large",
            });
        }
    }

    initGoogleLogin();
};