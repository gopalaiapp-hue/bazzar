import React, { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, useUser } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { LockScreen } from "@/components/LockScreen";
import SplashScreen from "@/components/SplashScreen";
import "./lib/i18n"; // Initialize i18n
import NotFound from "@/pages/not-found";

import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import Family from "@/pages/family";
import Tax from "@/pages/tax";
import Goals from "@/pages/goals";
import Profile from "@/pages/profile";
import PrivacyPolicy from "@/pages/privacy-policy";
import LenaDena from "@/pages/lena-dena";
import Budgets from "@/pages/budgets";
import Couple from "@/pages/couple";
import PocketDetails from "@/pages/pocket-details";
import Subscriptions from "@/pages/subscriptions";
import ResetPassword from "@/pages/reset-password";
import DebugPage from "@/pages/debug";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Onboarding} />
      <Route path="/home" component={Home} />
      <Route path="/family" component={Family} />
      <Route path="/tax" component={Tax} />
      <Route path="/goals" component={Goals} />
      <Route path="/profile" component={Profile} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/lena-dena" component={LenaDena} />
      <Route path="/budgets" component={Budgets} />
      <Route path="/couple" component={Couple} />
      <Route path="/pocket/:id" component={PocketDetails} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/debug" component={DebugPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * AuthGate - Unified authentication gate component
 * 
 * This component handles:
 * 1. Splash screen display during initial auth check
 * 2. Session validation using UserContext (single source of truth)
 * 3. Onboarding completion check
 * 4. Routing decision: Home (if logged in + onboarding done) vs Router (signin/onboarding)
 * 5. Capacitor app resume handling
 */
function AuthGate() {
  const { user, session, isLoading, isSessionValidated, refreshUser } = useUser();
  const [, setLocation] = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  // Splash screen state - only used if we want to force a minimum display time, 
  // but for P1 performance we want to be as fast as possible.
  // We will rely on isLoading and isSessionValidated from UseUser.

  // Capacitor/Browser visibility listener for app resume (background -> foreground)
  useEffect(() => {
    // Handle document visibility change (works in both browser and Capacitor)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('AuthGate: App became visible, re-checking auth...');
        // Reset auth check flag to allow re-checking
        setHasCheckedAuth(false);
        // Refresh user data
        await refreshUser();
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshUser]);

  // Auth check effect - runs after loading is done
  useEffect(() => {
    // Wait for UserContext to complete loading AND session to be validated
    if (isLoading || !isSessionValidated) {
      console.log("AuthGate: Waiting for initialization...", { isLoading, isSessionValidated });
      return;
    }

    // Prevent running multiple times
    if (hasCheckedAuth) {
      return;
    }

    setHasCheckedAuth(true);

    // Check if user is authenticated
    const isAuthenticated = !!session?.user;

    console.log("====== AuthGate: Auth Check ======");
    console.log("Authenticated:", isAuthenticated);
    console.log("Session User ID:", session?.user?.id);
    console.log("User Profile ID:", user?.id);
    console.log("User Onboarding Step:", user?.onboardingStep);
    console.log("Session Validated:", isSessionValidated);

    if (isAuthenticated) {
      // Check onboarding completion from Capacitor Preferences (native) or localStorage (web)
      const checkOnboardingStatus = async () => {
        let localStorageComplete = false;

        try {
          const { Preferences } = await import('@capacitor/preferences');
          const { Capacitor } = await import('@capacitor/core');

          if (Capacitor.isNativePlatform()) {
            const { value } = await Preferences.get({ key: 'onboarding_completed' });
            localStorageComplete = value === 'true';
            console.log('[AuthGate] Capacitor Preferences onboarding:', localStorageComplete);
          } else {
            localStorageComplete = localStorage.getItem('onboarding_completed') === 'true';
            console.log('[AuthGate] localStorage onboarding:', localStorageComplete);
          }
        } catch (e) {
          console.warn('[AuthGate] Failed to check Capacitor Preferences, falling back to localStorage:', e);
          localStorageComplete = localStorage.getItem('onboarding_completed') === 'true';
        }

        const profileComplete = user?.onboardingStep === 99;
        const isOnboardingComplete = localStorageComplete || profileComplete;

        console.log("LocalStorage/Preferences Onboarding:", localStorageComplete);
        console.log("Profile Onboarding:", profileComplete);
        console.log("Final Onboarding Status:", isOnboardingComplete);

        if (isOnboardingComplete) {
          // User is logged in and onboarding is complete - go to home
          console.log("✅ AuthGate: Redirecting to /home (authenticated + onboarding complete)");
          console.log("==================================");
          setLocation("/home");
        } else {
          // User is logged in but onboarding not complete - stay on onboarding
          console.log("⚠️ AuthGate: Staying on onboarding (authenticated but onboarding incomplete)");
          console.log("==================================");
        }
      };

      checkOnboardingStatus();
    } else {
      // No session - user needs to sign in
      console.log("❌ AuthGate: No session found, showing sign in");
      console.log("==================================");
    }
  }, [isLoading, isSessionValidated, session, user, hasCheckedAuth, setLocation]);

  // Sync Capacitor Preferences with user profile onboarding status
  // This ensures Preferences stays in sync if db says onboarding is complete
  useEffect(() => {
    if (user?.onboardingStep === 99) {
      // Save to Capacitor Preferences on native platforms
      import('@capacitor/preferences').then(async ({ Preferences }) => {
        try {
          const { Capacitor } = await import('@capacitor/core');
          if (Capacitor.isNativePlatform()) {
            await Preferences.set({ key: 'onboarding_completed', value: 'true' });
            if (user.id) {
              await Preferences.set({ key: 'user_id', value: user.id });
            }
            console.log('[App] Synced onboarding completion to Capacitor Preferences');
          }
        } catch (e) {
          console.warn('[App] Failed to sync to Capacitor Preferences:', e);
        }
      });

      // Also save to localStorage for web fallback
      try {
        localStorage.setItem('onboarding_completed', 'true');
        if (user.id) {
          localStorage.setItem('user_id', user.id);
        }
      } catch (e) {
        console.warn('Could not sync onboarding status to localStorage:', e);
      }
    }
  }, [user]);

  // Show splash screen while loading or validating session
  if (isLoading || !isSessionValidated) {
    return <SplashScreen />;
  }

  // Render the router - AuthGate handles redirection via setLocation
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <UserProvider>
          <ThemeProvider>
            <NotificationProvider>
              <LockScreen>
                <AuthGate />
              </LockScreen>
            </NotificationProvider>
          </ThemeProvider>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

