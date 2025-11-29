import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Wallet, FileText, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Wallet, label: "Goals", href: "/goals" },
    { icon: FileText, label: "Tax", href: "/tax" },
    { icon: Users, label: "Family", href: "/family" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  // Don't show on onboarding
  if (location === "/") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border pb-safe-area">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
              )}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
