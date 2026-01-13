import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { getUserById, createUserProfile } from "@/lib/supabaseApi";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { App } from '@capacitor/app'; // Native app lifecycle handling

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

                // CRITICAL: Trust the session if it exists
                // Don't try to validate it immediately - Supabase will handle token refresh automatically
                // Immediate validation can fail on slow networks or offline, causing false negatives
                if (session) {
                    console.log("[UserContext] Session found, trusting it (Supabase will auto-refresh if needed)");
                    setIsSessionValidated(true);
                }

                setSession(session);
                setSupabaseUser(session?.user ?? null);

                if (session?.user) {
                    try {
                        console.log("[UserContext] Fetching user profile...");
                        await fetchUserProfile(session.user.id, session.user);
                        console.log("[UserContext] User profile loaded successfully");
                    } catch (profileError) {
                        console.error("[UserContext] Profile fetch error (non-critical):", profileError);
                        // Don't fail auth if profile fetch fails - user is still authenticated
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
                console.log("[UserContext] Auth initialization complete");
                setIsLoading(false);
            }
        };


        // Add a 5-second timeout fallback to prevent infinite loading
        const timeout = setTimeout(() => {
            console.warn("[UserContext] Auth timeout - forcing loading state to complete");
            setIsSessionValidated(true);  // CRITICAL: Must also set this to prevent splash screen from staying forever
            setIsLoading(false);
        }, 5000);

        // Initialize auth and listeners
        const init = async () => {
            await initAuth().then(() => clearTimeout(timeout));

            // Native App Lifecycle Listener
            // Handles "cold start" behavior when app comes from background
            App.addListener('appStateChange', async (state) => {
                console.log("[UserContext] App state changed:", state.isActive ? "ACTIVE" : "BACKGROUND");
                if (state.isActive) {
                    console.log("[UserContext] App resumed, re-verifying session...");
                    // Re-check session on resume to fix "session lost" issues
                    const { data: { session: resumeSession } } = await supabase.auth.getSession();
                    if (resumeSession) {
                        console.log("[UserContext] Valid session found on resume");
                        setSession(resumeSession);
                        if (!user) {
                            await fetchUserProfile(resumeSession.user.id, resumeSession.user);
                        }
                    } else {
                        console.log("[UserContext] No session on resume");
                        // Only clear if we previously had a session AND it's invalid now
                        // Don't auto-logout here to prevent jarring UX, let AuthGate handle it
                    }
                }
            });
        };

        init();

        // Listen for Supabase auth changes
        const { data } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("Auth state changed:", event);

                setSession(session);
                setSupabaseUser(session?.user ?? null);

                if (event === 'SIGNED_IN' && session?.user) {
                    // Fetch profile in background, don't await blocking the event loop
                    fetchUserProfile(session.user.id, session.user).catch(e => console.error("Background profile fetch failed:", e));
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setLocation("/");
                } else if (event === 'TOKEN_REFRESHED') {
                    console.log("Token refreshed successfully");
                }
            }
        );
        subscription = data.subscription;

        return () => {
            clearTimeout(timeout);
            subscription?.unsubscribe();
            App.removeAllListeners(); // Cleanup native listeners
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
            console.log("[UserContext] Starting logout...");

            // 1. Sign out from Supabase first
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.warn("[UserContext] Supabase signOut error:", error);
            }

            // 2. Clear user state immediately
            setUser(null);
            setSupabaseUser(null);
            setSession(null);

            // 3. Clear localStorage auth data
            try {
                localStorage.removeItem('sb-mtdngnyatbiipyumqmdd-auth-token');
                localStorage.removeItem('onboarding_completed');
                localStorage.removeItem('user_id');
                localStorage.removeItem('bazaar_remembered_email');
                localStorage.removeItem('bazaar_remembered_pw');
            } catch (e) {
                console.warn("[UserContext] localStorage clear error:", e);
            }

            // 4. CRITICAL: Clear Capacitor Preferences (native storage) 
            // This is essential for mobile APK to fully clear session
            try {
                const { Preferences } = await import('@capacitor/preferences');
                const { Capacitor } = await import('@capacitor/core');

                if (Capacitor.isNativePlatform()) {
                    console.log("[UserContext] Clearing Capacitor Preferences...");
                    // Clear the specific auth token key
                    await Preferences.remove({ key: 'supabase_auth_sb-mtdngnyatbiipyumqmdd-auth-token' });
                    // Also try without prefix in case of mismatch
                    await Preferences.remove({ key: 'sb-mtdngnyatbiipyumqmdd-auth-token' });
                    // Clear onboarding completion flags
                    await Preferences.remove({ key: 'onboarding_completed' });
                    await Preferences.remove({ key: 'user_id' });
                    console.log("[UserContext] Capacitor Preferences cleared");
                }
            } catch (e) {
                console.warn("[UserContext] Capacitor Preferences clear error:", e);
            }

            console.log("[UserContext] Logout complete, navigating to home");
            setLocation("/");
            toast({ title: "Logged out" });
        } catch (error) {
            console.error("Logout error:", error);
            // Even if there's an error, still clear local state and redirect
            setUser(null);
            setSupabaseUser(null);
            setSession(null);
            setLocation("/");
            toast({ title: "Logged out", description: "Some data may not have been fully cleared" });
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
