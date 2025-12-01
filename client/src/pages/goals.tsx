import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Home, TrendingUp, Plus, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import type { Goal } from "@shared/schema";
import { useLocation } from "wouter";

export default function Goals() {
  const [, setLocation] = useLocation();
  const userId = localStorage.getItem("userId");

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["goals", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/goals/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch goals");
      const data = await res.json();
      return data.goals;
    },
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <MobileShell>
        <div className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">Please complete onboarding first.</p>
          <Button onClick={() => setLocation("/")}>Go to Onboarding</Button>
        </div>
      </MobileShell>
    );
  }

  const priorityGoal = goals.find(g => g.isPriority);
  const otherGoals = goals.filter(g => !g.isPriority);

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

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Hero Goal */}
            {priorityGoal && (
              <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <Home className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded uppercase">Priority</span>
                </div>

                <h2 className="text-xl font-bold mb-1">{priorityGoal.name}</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Target: ₹{(priorityGoal.targetAmount / 100).toLocaleString()}
                  {priorityGoal.deadline && ` by ${new Date(priorityGoal.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span>₹{((priorityGoal.currentAmount || 0) / 100).toLocaleString()} saved</span>
                    <span>{Math.round(((priorityGoal.currentAmount || 0) / priorityGoal.targetAmount) * 100)}%</span>
                  </div>
                  <Progress value={((priorityGoal.currentAmount || 0) / priorityGoal.targetAmount) * 100} className="h-3 bg-gray-100 text-orange-500" />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex gap-3 items-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold">On Track</p>
                      <p className="text-xs text-muted-foreground">Keep saving to reach your goal</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Add Funds
                </Button>
              </section>
            )}

            {/* Other Goals */}
            {otherGoals.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Other Goals</h3>
                <div className="grid gap-4">
                  {otherGoals.map(goal => (
                    <div key={goal.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm">{goal.name}</h4>
                        <p className="text-xs text-muted-foreground">Target: ₹{(goal.targetAmount / 100).toLocaleString()}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {goals.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">No goals yet. Start saving for your dreams!</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Goal
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MobileShell>
  );
}
