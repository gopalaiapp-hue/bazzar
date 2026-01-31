import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, Utensils, Receipt, Gift, AlertTriangle, ShieldAlert, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import generatedMeme from '@assets/generated_images/circular_budget_progress_with_warning_meme_for_budget_app.png';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { EmptyState } from "@/components/ui/empty-state";

// Helper to map icon names to components if needed, or just use emojis
const getIcon = (iconName: string) => {
  // Simple mapping or return default
  return ShoppingBag;
};

export default function Budgets() {
  const { user, supabaseUser } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [newLimit, setNewLimit] = useState("");

  // Use Auth ID if Profile ID is missing (Robustness fix)
  const userId = user?.id || supabaseUser?.id;

  // Add Budget State
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [newBudgetLimit, setNewBudgetLimit] = useState("");

  const { data: budgets = [], isLoading: isBudgetsLoading } = useQuery({
    queryKey: ["budgets", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });

      if (error) {
        console.error("Failed to fetch budgets:", error);
        throw new Error(error.message || "Failed to fetch budgets");
      }

      // Convert snake_case to camelCase (budgets table uses snake_case)
      return (data || []).map((budget: any) => ({
        id: budget.id,
        userId: budget.user_id,
        category: budget.category,
        limit: budget.limit,
        spent: budget.spent,
        month: budget.month,
        icon: budget.icon,
        color: budget.color
      }));
    },
    enabled: !!userId,
  });

  // Removed Full Page Blockers as per user request to "allow using app"
  // Loading state is handled inline now

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, limit }: { id: number, limit: number }) => {
      const { error } = await supabase
        .from('budgets')
        .update({ limit })
        .eq('id', id);

      if (error) {
        console.error("Budget update error:", error);
        throw new Error(error.message || "Failed to update budget");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setEditingBudget(null);
      toast({ title: "Budget Updated", description: "Limit has been updated successfully." });
    },
    onError: (error: any) => {
      console.error("Update budget mutation error:", error);
      toast({ title: "Error", description: error.message || "Failed to update budget.", variant: "destructive" });
    }
  });

  const addBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userId) throw new Error("User not authenticated");

      // Use current month dynamically
      const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2025-12"

      // Convert camelCase to snake_case for Supabase
      const { data: newBudget, error } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          category: data.category,
          limit: data.limit,
          month: currentMonth,
          spent: 0,
          icon: data.icon || null,
          color: data.color || null
        })
        .select()
        .single();

      if (error) {
        console.error("Budget creation error:", error);
        throw new Error(error.message || "Failed to create budget");
      }

      return newBudget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setAddBudgetOpen(false);
      setNewBudgetCategory("");
      setNewBudgetLimit("");
      toast({ title: "Budget Created", description: "Budget added successfully" });
    },
    onError: (error: Error) => {
      console.error("Add budget mutation error:", error);
      toast({ title: "Error", description: error.message || "Failed to create budget", variant: "destructive" });
    }
  });

  const handleCreateBudget = () => {
    if (!userId) {
      toast({ title: "Error", description: "User session not active. Please refresh.", variant: "destructive" });
      return;
    }
    if (!newBudgetCategory || !newBudgetLimit) {
      toast({ title: "Required", description: "Category and Limit are required", variant: "destructive" });
      return;
    }
    addBudgetMutation.mutate({ category: newBudgetCategory, limit: parseInt(newBudgetLimit) });
  };

  const handleSaveLimit = () => {
    if (editingBudget && newLimit) {
      updateBudgetMutation.mutate({ id: editingBudget.id, limit: parseInt(newLimit) });
    }
  };

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleAddBudget = () => { // This is the new handleAddBudget for the button click
    if (!userId) {
      setShowLoginPrompt(true);
      return;
    }
    setAddBudgetOpen(true);
  };

  return (
    <MobileShell>
      <div className="pb-20 space-y-4 px-4 pt-4">
        {/* Header with title and buttons */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Smart Budgets</h1>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={handleAddBudget} className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Add Budget
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast({ title: "Coming Soon", description: "This feature is under development." })}>
                Edit Limits
              </Button>
            </div>
          </div>
        </div>

        {/* Login Prompt Dialog */}
        <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign In Required</DialogTitle>
              <DialogDescription>
                You need to be signed in to add and manage budgets.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Save Your Progress</h4>
                  <p className="text-xs text-blue-700">Sign in to sync your budgets safely.</p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button variant="outline" className="flex-1" onClick={() => setShowLoginPrompt(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => {
                setShowLoginPrompt(false);
                setLocation("/");
              }}>
                Sign In Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Card */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
          <img src={generatedMeme} className="w-16 h-16 rounded-lg object-cover" alt="Budget alert" />
          <div>
            <h3 className="font-bold text-red-700 text-sm">Budget Over!</h3>
            <p className="text-xs text-red-600 mt-1 leading-relaxed">
              Shopping limit crossed by ₹200. <br />
              <span className="font-bold">"Priya se pooch lo ab!"</span>
            </p>
          </div>
        </div>

        {/* Budgets Grid */}
        <div className="grid gap-4">
          {isBudgetsLoading ? (
            <div className="text-center py-8">Loading budgets...</div>
          ) : budgets.length === 0 ? (
            <EmptyState
              type="budgets"
              title="No Budgets Set"
              description="Create category budgets to control your spending and stay on track"
              action={
                <Button onClick={handleAddBudget} className="bg-gradient-to-r from-orange-500 to-amber-500">
                  <Plus className="w-4 h-4 mr-2" /> Create First Budget
                </Button>
              }
            />
          ) : (
            budgets.map((b: any) => {
              const percentage = (b.spent / b.limit) * 100;
              const isOver = percentage > 100;
              const isWarning = percentage > 80 && !isOver;
              const isGood = percentage <= 80;
              const remaining = Math.max(0, b.limit - b.spent);
              const Icon = getIcon(b.icon);

              return (
                <div key={b.id} className={cn(
                  "bg-white p-4 rounded-2xl border shadow-sm transition-all",
                  isOver ? "border-red-200 bg-red-50/30" : isWarning ? "border-orange-200 bg-orange-50/20" : "border-gray-100"
                )}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {/* Circular Progress Indicator */}
                      <div className="relative">
                        <svg className="w-14 h-14 -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${Math.min(percentage, 100) * 1.51} 151`}
                            strokeLinecap="round"
                            className={cn(
                              "transition-all duration-500",
                              isOver ? "text-red-500" : isWarning ? "text-orange-500" : "text-green-500"
                            )}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={cn(
                            "text-xs font-bold",
                            isOver ? "text-red-600" : isWarning ? "text-orange-600" : "text-green-600"
                          )}>
                            {Math.min(Math.round(percentage), 999)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{b.category}</h3>
                        <p className="text-xs text-muted-foreground">
                          Limit: ₹{b.limit.toLocaleString()}
                        </p>
                        {isOver && (
                          <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-0.5">
                            <ShieldAlert className="w-3 h-3" /> Over by ₹{(b.spent - b.limit).toLocaleString()}
                          </p>
                        )}
                        {isGood && (
                          <p className="text-xs text-green-600 font-medium mt-0.5">
                            ₹{remaining.toLocaleString()} left
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setEditingBudget(b);
                          setNewLimit(b.limit.toString());
                        }}
                      >
                        Edit
                      </Button>
                      <p className={cn("font-bold mt-1", isOver ? "text-red-600" : "text-foreground")}>
                        ₹{b.spent.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">spent</p>
                    </div>
                  </div>

                  {/* Linear Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700 ease-out",
                          isOver
                            ? "bg-gradient-to-r from-red-400 to-red-600"
                            : isWarning
                              ? "bg-gradient-to-r from-orange-400 to-orange-500"
                              : "bg-gradient-to-r from-green-400 to-green-500"
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    {isOver && (
                      <div className="flex items-center justify-center gap-2 py-2 bg-red-100 rounded-lg mt-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-bold text-red-700">Budget Exceeded!</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Budget Limit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={editingBudget?.category} disabled />
              </div>
              <div className="space-y-2">
                <Label>New Limit (₹)</Label>
                <Input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="Enter new limit"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBudget(null)}>Cancel</Button>
              <Button onClick={handleSaveLimit}>Save Limit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addBudgetOpen} onOpenChange={setAddBudgetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="e.g. Travel" value={newBudgetCategory} onChange={(e) => setNewBudgetCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Limit (₹)</Label>
                <Input type="number" placeholder="5000" value={newBudgetLimit} onChange={(e) => setNewBudgetLimit(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddBudgetOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateBudget}>Create Budget</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileShell>
  );
}
