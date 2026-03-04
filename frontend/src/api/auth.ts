import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const api = axios.create({
    baseURL: '/auth', // Proxied to localhost:3001
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Auto-refresh token logic
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                await api.post('/refresh');
                return api(originalRequest);
            } catch (err) {
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    // Password
    signupPassword: (email: string, password: string) => api.post('/signup', { email, password }),
    loginPassword: (email: string, password: string) => api.post('/login', { email, password }),

    // WebAuthn Registration
    registerPasskey: async (email: string) => {
        // 1. Get options
        const resp = await api.post('/webauthn/register/options', { email });
        const options = resp.data;

        // 2. Browser ceremony
        const attResp = await startRegistration(options);

        // 3. Verify
        return api.post('/webauthn/register/verify', { email, response: attResp });
    },

    // WebAuthn Login
    loginPasskey: async (email: string) => {
        // 1. Get options
        const resp = await api.post('/webauthn/login/options', { email });
        const options = resp.data;

        // 2. Browser ceremony
        const asseResp = await startAuthentication(options);

        // 3. Verify
        return api.post('/webauthn/login/verify', { email, response: asseResp });
    },

    logout: () => api.post('/logout'),
    me: () => api.get('/me'),
};

export default api;
