import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Home, TrendingUp, Plus, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Goals() {
  return (
    <MobileShell>
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-heading font-bold">My Goals</h1>
            <p className="text-muted-foreground text-sm">Dream big, save smart</p>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" /> New Goal
          </Button>
        </div>

        {/* Hero Goal: Home */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="bg-orange-100 p-3 rounded-xl">
              <Home className="w-6 h-6 text-orange-600" />
            </div>
            <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded uppercase">Priority</span>
          </div>
          
          <h2 className="text-xl font-bold mb-1">Dream Home Down Payment</h2>
          <p className="text-muted-foreground text-sm mb-6">Target: ₹15 Lakh by April 2026</p>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm font-medium">
              <span>₹2.5 Lakh saved</span>
              <span>16%</span>
            </div>
            <Progress value={16} className="h-3 bg-gray-100 text-orange-500" />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex gap-3 items-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold">On Track</p>
                <p className="text-xs text-muted-foreground">You need to save ₹25k/month</p>
              </div>
            </div>
          </div>

          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            Add Funds
          </Button>
        </section>

        {/* Other Goals */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Other Goals</h3>
          <div className="grid gap-4">
             <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm">New Car</h4>
                  <p className="text-xs text-muted-foreground">Target: ₹8 Lakh</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
             </div>
             <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm">Europe Trip</h4>
                  <p className="text-xs text-muted-foreground">Target: ₹3 Lakh</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
             </div>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
