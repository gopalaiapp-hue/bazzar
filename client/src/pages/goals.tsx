import React, { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Home, TrendingUp, Plus, ChevronRight, Target, Calendar, Star, Bell } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Goal, GoalContribution } from "@shared/schema";
import { useLocation } from "wouter";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AddFundsSheet } from "@/components/ui/AddFundsSheet";
import { GoalDetailSheet } from "@/components/ui/GoalDetailSheet";
import { ContributionHistorySheet } from "@/components/ui/ContributionHistorySheet";
import { cn } from "@/lib/utils";

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
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState("monthly");

  // Sheets state
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showGoalDetail, setShowGoalDetail] = useState(false);
  const [showContributionHistory, setShowContributionHistory] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Fetch goals
  const { data: goals = [], isLoading: isGoalsLoading } = useQuery<Goal[]>({
    queryKey: ["goals", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });

      if (error) throw new Error(error.message || "Failed to fetch goals");

      // Convert snake_case to camelCase
      return (data || []).map((goal: any) => ({
        id: goal.id,
        userId: goal.user_id,
        name: goal.name,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount,
        deadline: goal.deadline,
        icon: goal.icon,
        isPriority: goal.is_priority,
        reminderEnabled: goal.reminder_enabled,
        reminderFrequency: goal.reminder_frequency,
        lastContributionDate: goal.last_contribution_date,
      }));
    },
    enabled: !!userId,
  });

  // Fetch contributions for selected goal
  const { data: contributions = [], isLoading: isContributionsLoading } = useQuery<GoalContribution[]>({
    queryKey: ["goalContributions", selectedGoal?.id],
    queryFn: async () => {
      if (!selectedGoal?.id) return [];

      const { data, error } = await supabase
        .from('goal_contributions')
        .select('*')
        .eq('goal_id', selectedGoal.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message || "Failed to fetch contributions");

      return (data || []).map((contribution: any) => ({
        id: contribution.id,
        goalId: contribution.goal_id,
        userId: contribution.user_id,
        amount: contribution.amount,
        source: contribution.source,
        note: contribution.note,
        createdAt: contribution.created_at,
      }));
    },
    enabled: !!selectedGoal?.id,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: {
      userId: string;
      name: string;
      targetAmount: number;
      deadline?: string;
      isPriority?: boolean;
      reminderEnabled?: boolean;
      reminderFrequency?: string;
    }) => {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: goalData.userId,
          name: goalData.name,
          target_amount: goalData.targetAmount,
          current_amount: 0,
          deadline: goalData.deadline || null,
          is_priority: goalData.isPriority || false,
          reminder_enabled: goalData.reminderEnabled || false,
          reminder_frequency: goalData.reminderFrequency || 'monthly',
          icon: '🎯'
        })
        .select()
        .single();

      if (error) throw new Error(error.message || "Failed to create goal");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowAddGoal(false);
      resetForm();
      toast({ title: "Goal Created! 🎯", description: "Start saving towards your new goal!" });
    },
    onError: (error: Error) => {
      console.error("Goal creation error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async (data: {
      goalId: number;
      amount: number;
      source: string;
      note?: string;
      date?: string;
    }) => {
      // Insert contribution
      const { data: contribution, error: contributionError } = await supabase
        .from('goal_contributions')
        .insert({
          goal_id: data.goalId,
          user_id: userId,
          amount: data.amount,
          source: data.source,
          note: data.note || null,
          created_at: data.date || new Date().toISOString(),
        })
        .select()
        .single();

      if (contributionError) throw new Error(contributionError.message || "Failed to add contribution");

      // Update goal's current_amount and last_contribution_date
      const currentGoal = goals.find(g => g.id === data.goalId);
      if (!currentGoal) throw new Error("Goal not found");

      const newCurrentAmount = (currentGoal.currentAmount || 0) + data.amount;

      const { error: updateError } = await supabase
        .from('goals')
        .update({
          current_amount: newCurrentAmount,
          last_contribution_date: data.date || new Date().toISOString(),
        })
        .eq('id', data.goalId);

      if (updateError) throw new Error(updateError.message || "Failed to update goal");

      return { contribution, newCurrentAmount };
    },
    onSuccess: (result, variables) => {
      const goal = goals.find(g => g.id === variables.goalId);
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goalContributions", variables.goalId] });
      setShowAddFunds(false);
      toast({
        title: `₹${(variables.amount / 100).toLocaleString()} added to '${goal?.name}' 🎯`,
        description: "Keep saving to reach your goal!"
      });
    },
    onError: (error: Error) => {
      console.error("Add funds error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw new Error(error.message || "Failed to delete goal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Goal Deleted", description: "Goal has been removed" });
    },
    onError: (error: Error) => {
      console.error("Delete goal error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setGoalName("");
    setTargetAmount("");
    setDeadline("");
    setIsPriority(false);
    setReminderEnabled(false);
    setReminderFrequency("monthly");
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
      reminderEnabled,
      reminderFrequency,
    });
  };

  const openAddGoalDialog = () => {
    resetForm();
    setShowAddGoal(true);
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowGoalDetail(true);
  };

  const handleAddFundsClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowAddFunds(true);
  };

  const handleAddFundsSubmit = (data: { amount: number; source: string; note?: string; date?: string }) => {
    if (!selectedGoal) return;
    addFundsMutation.mutate({
      goalId: selectedGoal.id,
      ...data,
    });
  };

  const handleViewAllContributions = () => {
    setShowGoalDetail(false);
    setShowContributionHistory(true);
  };

  const handleDeleteGoal = (goalId: number) => {
    deleteGoalMutation.mutate(goalId);
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
              <section
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => handleGoalClick(priorityGoal)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <span className="text-3xl">{priorityGoal.icon || '🏠'}</span>
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
                  <p className="text-xs text-orange-600 font-medium">
                    ₹{((priorityGoal.targetAmount - (priorityGoal.currentAmount || 0)) / 100).toLocaleString()} left to reach your goal
                  </p>
                </div>

                {priorityGoal.lastContributionDate && (
                  <p className="text-xs text-muted-foreground mb-4">
                    📅 Last added: {new Date(priorityGoal.lastContributionDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex gap-3 items-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold">On Track</p>
                      <p className="text-xs text-muted-foreground">Keep saving to reach your goal</p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddFundsClick(priorityGoal);
                  }}
                >
                  Add Funds
                </Button>
              </section>
            )}

            {/* Other Goals */}
            {otherGoals.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Other Goals</h3>
                <div className="grid gap-4">
                  {otherGoals.map(goal => {
                    const progress = Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100);
                    return (
                      <div
                        key={goal.id}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-transform hover:scale-[1.02]"
                        onClick={() => handleGoalClick(goal)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-sm mb-1">{goal.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              Target: ₹{(goal.targetAmount / 100).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-2xl">{goal.icon || '🎯'}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>₹{((goal.currentAmount || 0) / 100).toLocaleString()}</span>
                            <span className={cn(
                              "font-medium",
                              progress >= 100 ? "text-green-600" : "text-gray-600"
                            )}>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
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
            <div className="space-y-2">
              <Label>Goal Name *</Label>
              <Input
                placeholder="e.g., Dream Vacation, New Laptop"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Target Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>

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

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <div>
                  <Label className="text-sm font-medium">Enable Reminders</Label>
                  <p className="text-xs text-muted-foreground">Get notified to add funds</p>
                </div>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
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

      {/* Add Funds Sheet */}
      <AddFundsSheet
        isOpen={showAddFunds}
        onClose={() => setShowAddFunds(false)}
        goalName={selectedGoal?.name || ""}
        onSubmit={handleAddFundsSubmit}
        isLoading={addFundsMutation.isPending}
      />

      {/* Goal Detail Sheet */}
      <GoalDetailSheet
        isOpen={showGoalDetail}
        onClose={() => setShowGoalDetail(false)}
        goal={selectedGoal}
        contributions={contributions}
        onAddFunds={() => {
          setShowGoalDetail(false);
          setShowAddFunds(true);
        }}
        onDelete={handleDeleteGoal}
        onViewAllContributions={handleViewAllContributions}
      />

      {/* Contribution History Sheet */}
      <ContributionHistorySheet
        isOpen={showContributionHistory}
        onClose={() => setShowContributionHistory(false)}
        goalName={selectedGoal?.name || ""}
        contributions={contributions}
      />
    </MobileShell>
  );
}
