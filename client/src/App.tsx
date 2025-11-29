import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import Family from "@/pages/family";
import Tax from "@/pages/tax";
import Goals from "@/pages/goals";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Onboarding} />
      <Route path="/home" component={Home} />
      <Route path="/family" component={Family} />
      <Route path="/tax" component={Tax} />
      <Route path="/goals" component={Goals} />
      
      {/* Profile Placeholder */}
      <Route path="/profile">
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-muted-foreground">
          Profile Coming Soon
        </div>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
