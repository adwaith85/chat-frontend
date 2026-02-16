import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/Config';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

import { useAuthStore } from '../hooks/useAuthStore';

// Add interceptor to add token to requests
api.interceptors.request.use(
    async (config) => {
        try {
            const token = useAuthStore.getState().token || await AsyncStorage.getItem('token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching token for request:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add interceptor to handle response errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await useAuthStore.getState().clearAuth();
            // RootLayout effect will handle navigation
        }
        return Promise.reject(error);
    }
);

/**
 * Authentication related API calls
 */
export const authApi = {
    requestOTP: (email: string, name?: string) =>
        api.post('/user/request-otp', { email, name }),

    verifyOTP: (email: string, otp: string) =>
        api.post('/user/verify-otp', { email, otp }),

    logout: () =>
        api.post('/user/logout'),
};

/**
 * User and Profile related API calls
 */
export const userApi = {
    getMe: () =>
        api.get('/user/me'),

    getUsers: () =>
        api.get('/users'),

    getUserById: (id: string | number) =>
        api.get(`/user/${id}`),

    updateProfile: (data: FormData | any) =>
        api.put('/user/update', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    deleteAccount: (id: string | number) =>
        api.delete(`/user/${id}`),
};

/**
 * Chat and Messaging related API calls
 */
export const chatApi = {
    sendMessage: (data: { receiver_id: number, message: string, message_type?: string }) =>
        api.post('/api/chat/send', data),

    getMessages: (partner_id: number | string) =>
        api.get(`/api/chat/messages/${partner_id}`),

    getRecentChats: () =>
        api.get('/api/chat/recent'),

    getMessageById: (id: number | string) =>
        api.get(`/api/chat/message/${id}`),

    updateMessageStatus: (id: number | string, status: 'delivered' | 'read') =>
        api.put(`/api/chat/message/${id}`, { status }),

    deleteMessage: (id: number | string) =>
        api.delete(`/api/chat/message/${id}`),
};

export default api;
