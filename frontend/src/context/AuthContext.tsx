import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';

interface User {
    id: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (type: 'password' | 'passkey', email: string, password?: string) => Promise<void>;
    signup: (type: 'password' | 'passkey', email: string, password?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data } = await authApi.me();
                setUser(data.user);
            } catch (err) {
                // Not logged in
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (type: 'password' | 'passkey', email: string, password?: string) => {
        if (type === 'passkey') {
            const { data } = await authApi.loginPasskey(email);
            // Refresh user to get ID etc
            const me = await authApi.me();
            setUser(me.data.user);
        } else {
            const { data } = await authApi.loginPassword(email, password!);
            // Backend sends access token (handled by cookie/interceptor) + user
            // Or we fetch me
            const me = await authApi.me();
            setUser(me.data.user);
        }
    };

    const signup = async (type: 'password' | 'passkey', email: string, password?: string) => {
        if (type === 'passkey') {
            await authApi.registerPasskey(email);
        } else {
            await authApi.signupPassword(email, password!);
        }
        const me = await authApi.me();
        setUser(me.data.user);
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
