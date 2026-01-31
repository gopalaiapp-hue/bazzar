import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, Utensils, Receipt, Gift, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import generatedMeme from '@assets/generated_images/circular_budget_progress_with_warning_meme_for_budget_app.png';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Helper to map icon names to components if needed, or just use emojis
const getIcon = (iconName: string) => {
  // Simple mapping or return default
  return ShoppingBag;
};

export default function Budgets() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [newLimit, setNewLimit] = useState("");

  // Add Budget State
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [newBudgetLimit, setNewBudgetLimit] = useState("");

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/budgets/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch budgets");
      const data = await res.json();
      return data.budgets;
    },
    enabled: !!user?.id,
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, limit }: { id: number, limit: number }) => {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit }),
      });
      if (!res.ok) throw new Error("Failed to update budget");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setEditingBudget(null);
      toast({ title: "Budget Updated", description: "Limit has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update budget.", variant: "destructive" });
    }
  });

  const addBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user?.id, month: "2025-11", spent: 0 })
      });
      if (!res.ok) throw new Error("Failed to create budget");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setAddBudgetOpen(false);
      setNewBudgetCategory("");
      setNewBudgetLimit("");
      toast({ title: "Budget Created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create budget", variant: "destructive" });
    }
  });

  const handleAddBudget = () => {
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

  return (
    <MobileShell>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Smart Budgets</h1>
            <p className="text-muted-foreground text-sm">November 2025</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddBudgetOpen(true)}>+ Add</Button>
            <Button size="sm" variant="outline" onClick={() => toast({ title: "Info", description: "Click 'Edit' on individual budgets to change limits." })}>Edit Limits</Button>
          </div>
        </div>

        {/* Alert Card */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
          <img src={generatedMeme} className="w-16 h-16 rounded-lg object-cover" alt="Angry meme" />
          <div>
            <h3 className="font-bold text-red-700 text-sm">Budget Over!</h3>
            <p className="text-xs text-red-600 mt-1 leading-relaxed">
              Shopping limit crossed by ₹200. <br />
              <span className="font-bold">"Priya se pooch lo ab!"</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Loading budgets...</div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No budgets set.</div>
          ) : (
            budgets.map((b: any) => {
              const percentage = (b.spent / b.limit) * 100;
              const isOver = percentage > 100;
              const isWarning = percentage > 80 && !isOver;
              const Icon = getIcon(b.icon);

              return (
                <div key={b.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", b.color || "bg-blue-100 text-blue-600")}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{b.category}</h3>
                        <p className="text-xs text-muted-foreground">
                          Limit: ₹{b.limit.toLocaleString()}
                        </p>
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

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className={cn(isOver ? "text-red-600" : isWarning ? "text-orange-600" : "text-green-600")}>
                        {Math.round(percentage)}% used
                      </span>
                      {isOver && <span className="text-red-600 flex items-center"><ShieldAlert className="w-3 h-3 mr-1" /> Blocked</span>}
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={cn("h-2", isOver ? "bg-red-100" : "bg-gray-100")}
                      indicatorClassName={isOver ? "bg-red-600" : isWarning ? "bg-orange-500" : "bg-green-500"}
                    />
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
              <Button onClick={handleAddBudget}>Create Budget</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileShell>
  );
}
