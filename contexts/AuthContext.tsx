'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Demo credentials for testing
const DEMO_CREDENTIALS = {
    email: 'admin.cablemaster@mail.com',
    password: 'admin123*',
};

const DEMO_PROFILE: Profile = {
    id: 'demo-user-id',
    email: 'admin.cablemaster@mail.com',
    full_name: 'Admin Demo',
    role: 'master',
    phone: '961 248 3470',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isRole: (roles: string[]) => boolean;
    isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check for demo session first
        const demoSession = localStorage.getItem('demo_session');
        if (demoSession === 'active') {
            setProfile(DEMO_PROFILE);
            setIsDemoMode(true);
            setLoading(false);
            return;
        }

        // Check current Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        setLoading(true);

        // Check for demo credentials
        if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
            localStorage.setItem('demo_session', 'active');
            setProfile(DEMO_PROFILE);
            setIsDemoMode(true);
            setLoading(false);
            // Use setTimeout to allow state to update before navigation
            setTimeout(() => router.push('/admin'), 100);
            return;
        }

        // Try Supabase authentication
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Fetch profile to determine redirect
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileData) {
                setProfile(profileData);

                // Redirect based on role
                switch (profileData.role) {
                    case 'master':
                    case 'admin':
                        router.push('/admin');
                        break;
                    case 'counter':
                        router.push('/dashboard/counter');
                        break;
                    case 'tech':
                        router.push('/dashboard/tech');
                        break;
                    case 'client':
                        router.push('/client/dashboard');
                        break;
                    default:
                        router.push('/');
                }
            }
        } catch (error: any) {
            throw new Error(error.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        // Clear demo session
        localStorage.removeItem('demo_session');
        setIsDemoMode(false);

        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        router.push('/login');
    };

    const isRole = (roles: string[]) => {
        return profile ? roles.includes(profile.role) : false;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                signIn,
                signOut,
                isRole,
                isDemoMode,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
