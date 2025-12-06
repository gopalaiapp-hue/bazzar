import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "./UserContext";

type Theme = "light" | "dark" | "system";
type Accent = "Kesari Orange" | "Ocean Blue" | "Emerald Green" | "Ruby Red" | "Purple Royale";

type ThemeContextType = {
    theme: Theme;
    accent: Accent;
    isLiteMode: boolean;
    setTheme: (theme: Theme) => void;
    setAccent: (accent: Accent) => void;
    setLiteMode: (enabled: boolean) => void;
    applyTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const [theme, setTheme] = useState<Theme>("light");
    const [accent, setAccent] = useState<Accent>("Kesari Orange");
    const [isLiteMode, setLiteMode] = useState(false);

    // Load theme from user settings or localStorage
    useEffect(() => {
        // Check user settings first
        if (user?.settings?.theme) {
            setTheme(user.settings.theme);
        }
        if (user?.settings?.accent) {
            setAccent(user.settings.accent);
        }
        if (user?.settings?.liteMode) {
            setLiteMode(user.settings.liteMode);
        }

        // Check localStorage as fallback
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        const savedAccent = localStorage.getItem("accent") as Accent | null;
        const savedLiteMode = localStorage.getItem("liteMode") === "true";

        if (savedTheme) setTheme(savedTheme);
        if (savedAccent) setAccent(savedAccent);
        if (savedLiteMode) setLiteMode(savedLiteMode);
    }, [user]);

    // Apply theme changes to the document
    const applyTheme = () => {
        const root = document.documentElement;

        // Remove all theme classes first
        root.classList.remove("light", "dark");

        // Apply the selected theme
        if (theme === "system") {
            // Use system preference
            const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            if (systemPrefersDark) {
                root.classList.add("dark");
            } else {
                root.classList.add("light");
            }
        } else if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.add("light");
        }

        // Apply accent color
        applyAccentColor(accent);

        // Apply lite mode
        applyLiteMode(isLiteMode);

        // Save to localStorage
        localStorage.setItem("theme", theme);
        localStorage.setItem("accent", accent);
        localStorage.setItem("liteMode", isLiteMode.toString());
    };

    const applyAccentColor = (accent: Accent) => {
        const root = document.documentElement;
        let primaryColor = "";
        let secondaryColor = "";

        switch (accent) {
            case "Kesari Orange":
                primaryColor = "35 92% 55%"; // Marigold Orange
                secondaryColor = "221 83% 53%"; // Vibrant Blue
                break;
            case "Ocean Blue":
                primaryColor = "217 91% 60%"; // Ocean Blue
                secondaryColor = "142 71% 45%"; // Emerald Green
                break;
            case "Emerald Green":
                primaryColor = "142 71% 45%"; // Emerald Green
                secondaryColor = "262 83% 58%"; // Purple Royale
                break;
            case "Ruby Red":
                primaryColor = "0 84.2% 60.2%"; // Ruby Red
                secondaryColor = "24 95% 53%"; // Golden Yellow
                break;
            case "Purple Royale":
                primaryColor = "262 83% 58%"; // Purple Royale
                secondaryColor = "35 92% 55%"; // Marigold Orange
                break;
        }

        root.style.setProperty("--primary", primaryColor);
        root.style.setProperty("--secondary", secondaryColor);
    };

    const applyLiteMode = (enabled: boolean) => {
        const root = document.documentElement;

        if (enabled) {
            root.classList.add("lite-mode");
            root.style.setProperty("--font-size-base", "1.1rem");
            root.style.setProperty("--font-size-sm", "1.2rem");
            root.style.setProperty("--font-size-xs", "1.1rem");
        } else {
            root.classList.remove("lite-mode");
            root.style.removeProperty("--font-size-base");
            root.style.removeProperty("--font-size-sm");
            root.style.removeProperty("--font-size-xs");
        }
    };

    // Apply theme on mount and when theme changes
    useEffect(() => {
        applyTheme();
    }, [theme, accent, isLiteMode]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            if (theme === "system") {
                const root = document.documentElement;
                root.classList.remove("light", "dark");
                if (e.matches) {
                    root.classList.add("dark");
                } else {
                    root.classList.add("light");
                }
            }
        };

        mediaQuery.addEventListener("change", handleSystemThemeChange);
        return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }, [theme]);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                accent,
                isLiteMode,
                setTheme,
                setAccent,
                setLiteMode,
                applyTheme
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}