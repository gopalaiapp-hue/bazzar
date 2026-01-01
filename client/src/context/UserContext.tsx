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
    isSessionValidated: boolean;
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
    const [isSessionValidated, setIsSessionValidated] = useState(false);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Fetch user profile from our users table - auto-create if missing
    const fetchUserProfile = async (userId: string, authUser?: SupabaseUser | null) => {
        try {
            let profile = await getUserById(userId);

            // CRITICAL FIX: If profile doesn't exist, create it from auth user data
            if (!profile && authUser) {
                console.log("Profile not found, auto-creating for user:", userId);
                try {
                    profile = await createUserProfile({
                        id: userId,
                        email: authUser.email,
                        name: authUser.user_metadata?.name || null,
                        role: 'admin',
                        onboarding_step: 0,
                        onboarding_complete: false,
                    });
                    console.log("Auto-created profile:", profile);
                } catch (createError) {
                    console.warn("Could not auto-create profile:", createError);
                    // Create a minimal user object from auth data
                    profile = {
                        id: userId,
                        email: authUser.email || null,
                        name: authUser.user_metadata?.name || null,
                        familyType: null,
                        onboardingStep: 0,
                        role: 'admin',
                    } as any;
                }
            }

            if (profile) {
                // Add email verification status from auth user
                const emailVerified = authUser?.email_confirmed_at != null;
                setUser({ ...profile, emailVerified } as User);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            // Even if profile fetch fails, set minimal user from auth
            if (authUser) {
                setUser({
                    id: userId,
                    email: authUser.email || null,
                    name: authUser.user_metadata?.name || null,
                    familyType: null,
                    onboardingStep: 0,
                } as User);
            }
        }
    };

    // Initialize auth state
    useEffect(() => {
        let subscription: { unsubscribe: () => void } | null = null;

        // Get initial session with timeout and error handling
        const initAuth = async () => {
            console.log("[UserContext] Initializing auth state...");
            try {
                // First, try to get the persisted session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("[UserContext] Auth session error:", error);
                    setIsSessionValidated(true);
                    setIsLoading(false);
                    return;
                }

                console.log("[UserContext] Session retrieved:", session ? `User: ${session.user.id}` : "No session");

                // If we have a session, also verify it's still valid by refreshing
                if (session) {
                    console.log("[UserContext] Validating session...");
                    const { data: { user: refreshedUser }, error: refreshError } = await supabase.auth.getUser();

                    if (refreshError) {
                        console.warn("[UserContext] Session refresh failed:", refreshError.message);

                        // IMPORTANT: Only clear session if it's strictly an Auth error (token expired/invalid)
                        // Do NOT clear on network errors (fetch failed), as we want to allow offline access
                        const isNetworkError = refreshError.message.toLowerCase().includes('fetch') ||
                            refreshError.message.toLowerCase().includes('network');

                        if (!isNetworkError) {
                            console.log("[UserContext] Invalid session, clearing...");
                            setSession(null);
                            setSupabaseUser(null);
                            setIsSessionValidated(true);
                        } else {
                            console.log("[UserContext] Network error during validation, keeping potentially valid session");
                            // Still mark as validated even with network error - we'll use cached session
                            setIsSessionValidated(true);
                        }
                    } else {
                        console.log("[UserContext] Session validated successfully for user:", refreshedUser?.id);
                        setIsSessionValidated(true);
                    }
                }

                setSession(session);
                setSupabaseUser(session?.user ?? null);

                if (session?.user) {
                    try {
                        console.log("[UserContext] Fetching user profile...");
                        await fetchUserProfile(session.user.id, session.user);
                        console.log("[UserContext] User profile loaded successfully");
                    } catch (profileError) {
                        console.error("[UserContext] Profile fetch error:", profileError);
                    }
                }

                // If no session, mark as validated immediately
                if (!session) {
                    setIsSessionValidated(true);
                }
            } catch (error) {
                console.error("[UserContext] Auth initialization error:", error);
                setIsSessionValidated(true);
            } finally {
                // Always set loading to false after attempt
                console.log("[UserContext] Auth initialization complete, validated:", isSessionValidated);
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
                isSessionValidated,
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
