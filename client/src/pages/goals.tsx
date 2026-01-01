import React, { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Home, TrendingUp, Plus, ChevronRight, Target, Calendar, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Goal } from "@shared/schema";
import { useLocation } from "wouter";
import { useUser } from "@/context/UserContext";
import { apiUrl } from "@/lib/api-config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Goals() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isUserLoading } = useUser();
  const userId = user?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog and form state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isPriority, setIsPriority] = useState(false);

  const { data: goals = [], isLoading: isGoalsLoading } = useQuery<Goal[]>({
    queryKey: ["goals", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(apiUrl(`/api/goals/${userId}`));
      if (!res.ok) throw new Error("Failed to fetch goals");
      const data = await res.json();
      return data.goals || [];
    },
    enabled: !!userId,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: { userId: string; name: string; targetAmount: number; deadline?: string; isPriority?: boolean }) => {
      const res = await fetch(apiUrl("/api/goals"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create goal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowAddGoal(false);
      resetForm();
      toast({ title: "Goal Created! 🎯", description: "Start saving towards your new goal!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setGoalName("");
    setTargetAmount("");
    setDeadline("");
    setIsPriority(false);
  };

  const handleCreateGoal = () => {
    if (!userId || !goalName.trim() || !targetAmount) {
      toast({ title: "Missing fields", description: "Please fill in goal name and target amount", variant: "destructive" });
      return;
    }

    createGoalMutation.mutate({
      userId,
      name: goalName.trim(),
      targetAmount: parseInt(targetAmount) * 100, // Convert to paise
      deadline: deadline || undefined,
      isPriority,
    });
  };

  const openAddGoalDialog = () => {
    resetForm();
    setShowAddGoal(true);
  };

  // Show loading spinner while user data is being fetched
  if (isUserLoading) {
    return (
      <MobileShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileShell>
    );
  }

  // Show message only if no user context (not logged in)
  if (!user || !userId) {
    return (
      <MobileShell>
        <div className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">Please log in to view your goals.</p>
          <Button onClick={() => setLocation("/")}>Go to Login</Button>
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
          <Button size="sm" variant="outline" onClick={openAddGoalDialog}>
            <Plus className="w-4 h-4 mr-2" /> New Goal
          </Button>
        </div>

        {isGoalsLoading ? (
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
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <Target className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Set Your First Goal</h3>
                  <p className="text-sm max-w-xs mx-auto">Whether it's a vacation, new gadget, or home - start saving today!</p>
                </div>
                <Button onClick={openAddGoalDialog} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Goal
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Create New Goal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Goal Name */}
            <div className="space-y-2">
              <Label>Goal Name *</Label>
              <Input
                placeholder="e.g., Dream Vacation, New Laptop"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>

            {/* Target Amount */}
            <div className="space-y-2">
              <Label>Target Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Target Date (Optional)
              </Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Priority Toggle */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-600" />
                <div>
                  <Label className="text-sm font-medium">Make Priority Goal</Label>
                  <p className="text-xs text-muted-foreground">Shows prominently on dashboard</p>
                </div>
              </div>
              <Switch
                checked={isPriority}
                onCheckedChange={setIsPriority}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGoal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGoal}
              disabled={createGoalMutation.isPending || !goalName.trim() || !targetAmount}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
