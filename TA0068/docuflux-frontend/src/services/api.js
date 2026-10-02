// ─── DocuFlux Authenticated API Instance ─────────────────────────────────────
// Axios instance that auto-injects the JWT token and handles 401 errors.
// Uses sessionStorage so each browser tab is an independent session.

import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Auto-inject JWT token from sessionStorage
api.interceptors.request.use((config) => {
    try {
        const userInfoStr = sessionStorage.getItem('userInfo');
        if (userInfoStr) {
            const user = JSON.parse(userInfoStr);
            if (user?.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
    } catch {
        // ignore parse errors
    }
    return config;
});

// Handle 401 — clear session and redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('userInfo');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
