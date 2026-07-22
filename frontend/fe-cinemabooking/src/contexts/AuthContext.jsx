import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const restoreSession = async () => {
            setUser(await authService.getCurrentUser());
            setLoading(false);
        };
        restoreSession();
    }, []);
    const signIn = async (email, password) => {
        try {
            const user = await authService.login(email, password);
            setUser(user);
            return { error: null };
        }
        catch (error) {
            return { error };
        }
    };
    const adminSignIn = async (username, password) => {
        try {
            const user = await authService.adminLogin(username, password);
            setUser(user);
            return { error: null };
        }
        catch (error) {
            return { error };
        }
    };
    const signUp = async (email, password, fullName) => {
        try {
            await authService.register(email, password, fullName);
            return { error: null };
        }
        catch (error) {
            return { error };
        }
    };
    const signOut = async () => {
        await authService.logout();
        setUser(null);
    };
    const isAdmin = user?.role === 'admin';
    const value = {
        user,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        adminSignIn,
    };
    return (<AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>);
}
// Custom hook for easy access to the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
