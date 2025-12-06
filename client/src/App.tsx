import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { LockScreen } from "@/components/LockScreen";
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
      <Route path="/lenadena" component={LenaDena} />
      <Route path="/budgets" component={Budgets} />
      <Route path="/couple" component={Couple} />
      <Route path="/pocket/:id" component={PocketDetails} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route component={NotFound} />
    </Switch>
  );
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
                <Router />
              </LockScreen>
            </NotificationProvider>
          </ThemeProvider>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

