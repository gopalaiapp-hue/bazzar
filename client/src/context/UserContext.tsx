import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { getUserById, createUserProfile } from "@/lib/supabaseApi";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

type User = {
    id: string;
    name: string | null;
    email: string | null;
    familyType: "mai_sirf" | "couple" | "joint" | null;
    onboardingStep: number;
    language?: string;
    settings?: any;
    phone?: string | null;
    role?: string;
    profileImage?: string;
    emailVerified?: boolean;
};

type UserContextType = {
    user: User | null;
    supabaseUser: SupabaseUser | null;
    session: Session | null;
    isLoading: boolean;
    familyType: "mai_sirf" | "couple" | "joint" | null;
    login: (user: User) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Fetch user profile from our users table
    const fetchUserProfile = async (userId: string, authUser?: SupabaseUser | null) => {
        try {
            const profile = await getUserById(userId);
            if (profile) {
                // Add email verification status from auth user
                const emailVerified = authUser?.email_confirmed_at != null;
                setUser({ ...profile, emailVerified } as User);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
        }
    };

    // Initialize auth state
    useEffect(() => {
        let subscription: { unsubscribe: () => void } | null = null;

        // Get initial session with timeout and error handling
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Auth session error:", error);
                    setIsLoading(false);
                    return;
                }

                setSession(session);
                setSupabaseUser(session?.user ?? null);

                if (session?.user) {
                    try {
                        await fetchUserProfile(session.user.id, session.user);
                    } catch (profileError) {
                        console.error("Profile fetch error:", profileError);
                    }
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                // Always set loading to false after attempt
                setIsLoading(false);
            }
        };

        // Add a 5-second timeout fallback to prevent infinite loading
        const timeout = setTimeout(() => {
            console.warn("Auth timeout - forcing loading state to false");
            setIsLoading(false);
        }, 5000);

        initAuth().then(() => clearTimeout(timeout));

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("Auth state changed:", event);
                setSession(session);
                setSupabaseUser(session?.user ?? null);

                if (event === 'SIGNED_IN' && session?.user) {
                    await fetchUserProfile(session.user.id, session.user);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setLocation("/");
                }
            }
        );
        subscription = data.subscription;

        return () => {
            clearTimeout(timeout);
            subscription?.unsubscribe();
        };
    }, []);

    const refreshUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            await fetchUserProfile(authUser.id, authUser);
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        if (user?.language) {
            import("../lib/i18n").then((module) => {
                module.default.changeLanguage(user.language);
                try {
                    if (user.language) {
                        localStorage.setItem('sahkosh_language', user.language);
                    }
                } catch (e) {
                    console.warn('Could not save language to localStorage:', e);
                }
            });
        }
    }, [user]);

    const login = (userData: User) => {
        setUser(userData);
        setLocation("/home");
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setSupabaseUser(null);
            setSession(null);
            setLocation("/");
            toast({ title: "Logged out" });
        } catch (error) {
            console.error("Logout error:", error);
            toast({ title: "Logout failed", variant: "destructive" });
        }
    };

    return (
        <UserContext.Provider
            value={{
                user,
                supabaseUser,
                session,
                isLoading,
                familyType: user?.familyType || null,
                login,
                logout,
                refreshUser
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
