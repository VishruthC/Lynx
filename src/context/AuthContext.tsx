import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (e: string, p: string) => Promise<void>;
    signup: (e: string, p: string) => Promise<void>;
    logout: () => Promise<void>;
    setError: (err: string | null) => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (e: string, p: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, e, p);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const signup = async (e: string, p: string) => {
        setError(null);
        try {
            await createUserWithEmailAndPassword(auth, e, p);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const logout = async () => {
        setError(null);
        try {
            await signOut(auth);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, error, setError }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
