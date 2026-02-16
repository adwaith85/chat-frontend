import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
    token: string | null;
    user: any | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    setAuth: (token: string, user: any) => Promise<void>;
    clearAuth: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isInitialized: false,
    setAuth: async (token: string, user: any) => {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ token, user, isAuthenticated: true, isInitialized: true });
    },
    clearAuth: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
    },
    initialize: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userStr = await AsyncStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            // If we have both, we are authenticated
            if (token && user) {
                set({ token, user, isAuthenticated: true, isInitialized: true });
            } else {
                // If either is missing, ensure both are cleared
                if (token || userStr) {
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                }
                set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
        }
    },
}));
