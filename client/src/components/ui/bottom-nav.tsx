import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Users, User, Heart, PieChart, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { useTranslation } from "react-i18next";

export function BottomNav() {
  const [location] = useLocation();
  const { familyType, isLoading } = useUser();
  const { t } = useTranslation();

  const baseItems = [
    { icon: Home, label: t('navigation.home'), href: "/home" },
    { icon: ArrowRightLeft, label: t('navigation.lenaDena'), href: "/lenadena" },
    { icon: PieChart, label: t('navigation.budget'), href: "/budgets" },
    { icon: User, label: t('navigation.profile'), href: "/profile" },
  ];

  let navItems = [...baseItems];

  // mai_sirf: No We, No Family
  // couple: Show We only
  // joint: Show both We and Family
  if (familyType === 'couple' || familyType === 'joint') {
    navItems.splice(2, 0, { icon: Heart, label: t('navigation.we'), href: "/couple" });
  }

  if (familyType === 'joint') {
    navItems.push({ icon: Users, label: t('navigation.family'), href: "/family" });
  }

  if (isLoading) {
    navItems = baseItems;
  }

  // Don't show on onboarding
  if (location === "/") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-border pb-safe-area z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer min-w-[60px]",
                "transition-all duration-200 ease-out",
                "active:scale-90 active:opacity-70",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
              )}>
                <div className={cn(
                  "relative transition-all duration-300 ease-out",
                  isActive && "bg-primary/10 rounded-xl px-4 py-1.5 scale-105"
                )}>
                  <item.icon
                    size={isActive ? 22 : 20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "transition-all duration-200",
                      isActive && "text-primary animate-pulse"
                    )}
                  />
                  {item.label === "We" && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive && "font-bold text-primary transform scale-105"
                )}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
