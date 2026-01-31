import React from "react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/ui/bottom-nav";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
  showNav?: boolean;
  header?: React.ReactNode;
}

export function MobileShell({ children, className, showNav = true, header }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen shadow-2xl relative flex flex-col">
        {header}
        <main className={cn("flex-1 overflow-y-auto pb-20", className)}>
          {children}
        </main>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
