import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (response.data) {
        sessionStorage.setItem('userInfo', JSON.stringify(response.data));
    }
    return response.data;
};

export const signup = async (userData) => {
    const response = await axios.post(`${API_URL}/auth/signup`, userData);
    if (response.data) {
        sessionStorage.setItem('userInfo', JSON.stringify(response.data));
    }
    return response.data;
};

export const logout = () => {
    sessionStorage.removeItem('userInfo');
};

export const getCurrentUser = () => {
    try {
        const userStr = sessionStorage.getItem('userInfo');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};
