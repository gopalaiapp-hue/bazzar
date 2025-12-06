import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
};

type UserContextType = {
    user: User | null;
    isLoading: boolean;
    familyType: "mai_sirf" | "couple" | "joint" | null;
    login: (user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const safeGetItem = (key: string) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("Storage access denied:", e);
            return null;
        }
    };

    const safeSetItem = (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("Storage access denied:", e);
        }
    };

    const safeRemoveItem = (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn("Storage access denied:", e);
        }
    };

    const refreshUser = async () => {
        const userId = safeGetItem("userId");
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            // We need an endpoint to get user details. 
            // Currently we might not have a dedicated /api/auth/me, but we can use /api/users/:id if it exists
            // or rely on the fact that we just have the ID.
            // For now, let's assume we can fetch user details.
            // If not, we might need to add a route.
            // Let's check if we can get user data.
            // Actually, let's add /api/auth/me to routes.ts first or use an existing one.
            // For now, I'll implement a simple fetch.

            // Wait, the user added /api/auth/signup and signin which return { user }.
            // We need a way to get the user on reload.
            // Let's assume we'll add /api/users/:id or similar.
            // For now, let's try to fetch from a hypothetical endpoint or just use what we have.
            // The user's code in onboarding sets localStorage.

            // Let's implement a fetch to /api/users/:id (we need to ensure this route exists or add it)
            // I'll add fetching logic here, assuming the route will be available.

            const res = await fetch(`/api/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                // If fetch fails (e.g. user deleted), clear storage
                safeRemoveItem("userId");
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    useEffect(() => {
        if (user?.language) {
            import("../lib/i18n").then((module) => {
                module.default.changeLanguage(user.language);
                // Also sync to localStorage to ensure persistence
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
        safeSetItem("userId", userData.id);
        setLocation("/home");
    };

    const logout = () => {
        setUser(null);
        safeRemoveItem("userId");
        setLocation("/");
        toast({ title: "Logged out" });
    };

    return (
        <UserContext.Provider
            value={{
                user,
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
