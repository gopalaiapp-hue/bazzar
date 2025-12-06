import { Wallet, Building2, Smartphone, Briefcase, PiggyBank, ArrowRightLeft, Target, Calendar, TrendingUp, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PocketProps {
  id: string;
  name: string;
  type: "custom" | "cash" | "bank" | "upi" | "salary" | "savings" | "family";
  amount: number;
  spent?: number;
  targetAmount?: number;
  deadline?: string;
  monthlyContribution?: number;
  linkedCategories?: string[];
  icon?: string;
  color?: string;
  onAddMoney?: (amount: number) => void;
  onTransfer?: () => void;
  onClick?: () => void;
}

export function PocketCard({
  id,
  name,
  type,
  amount,
  spent = 0,
  targetAmount,
  deadline,
  monthlyContribution,
  icon,
  color = "bg-blue-500",
  onAddMoney,
  onTransfer,
  onClick
}: PocketProps) {
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");

  const getDefaultIcon = () => {
    switch (type) {
      case "cash": return <Wallet className="w-5 h-5 text-white" />;
      case "bank": return <Building2 className="w-5 h-5 text-white" />;
      case "upi": return <Smartphone className="w-5 h-5 text-white" />;
      case "salary": return <Briefcase className="w-5 h-5 text-white" />;
      case "savings": return <PiggyBank className="w-5 h-5 text-white" />;
      default: return <Wallet className="w-5 h-5 text-white" />;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatCompact = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val}`;
  };

  // Calculate progress for savings goals
  const isSavingsGoal = !!targetAmount && targetAmount > 0;
  const progress = isSavingsGoal ? Math.min((amount / targetAmount) * 100, 100) : 0;

  // Calculate spending progress for budget pockets
  const isBudgetPocket = !isSavingsGoal && spent > 0;
  const budgetTotal = amount + spent;
  const spentPercentage = budgetTotal > 0 ? (spent / budgetTotal) * 100 : 0;

  // Progress bar color
  const getProgressColor = (percent: number, isSpending: boolean) => {
    if (isSpending) {
      // For spending: green is good, red is bad
      if (percent >= 90) return "bg-red-500";
      if (percent >= 75) return "bg-orange-500";
      if (percent >= 50) return "bg-yellow-500";
      return "bg-green-500";
    } else {
      // For savings: higher is better
      if (percent >= 100) return "bg-green-500";
      if (percent >= 75) return "bg-emerald-500";
      if (percent >= 50) return "bg-blue-500";
      return "bg-blue-400";
    }
  };

  // Days remaining for deadline
  const getDaysRemaining = () => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  const handleAddMoney = () => {
    if (addAmount && parseInt(addAmount) > 0) {
      onAddMoney?.(parseInt(addAmount));
      setAddAmount("");
      setAddMoneyOpen(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[160px] relative overflow-hidden group cursor-pointer"
    >
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 ${color}`} />

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${color}`}>
          {icon ? <span className="text-lg">{icon}</span> : getDefaultIcon()}
        </div>
        <div className="flex gap-1">
          {onAddMoney && (
            <Dialog open={addMoneyOpen} onOpenChange={setAddMoneyOpen}>
              <DialogTrigger asChild>
                <button className="text-gray-400 hover:text-green-600 p-1">
                  <Plus className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Money to {name}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddMoneyOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddMoney} className="bg-green-600 hover:bg-green-700">
                    Add Money
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {onTransfer && (
            <button className="text-gray-400 hover:text-blue-600 p-1" onClick={onTransfer}>
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Name and Balance */}
      <div className="flex-1">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
          {name}
        </p>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">
          {formatCurrency(amount)}
        </h3>

        {/* Progress Bar for Savings Goals */}
        {isSavingsGoal && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>{Math.round(progress)}% of goal</span>
              <span>{formatCompact(targetAmount)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full rounded-full", getProgressColor(progress, false))}
              />
            </div>
            {daysRemaining !== null && (
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{daysRemaining} days left</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar for Budget Pockets (Spending) */}
        {isBudgetPocket && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>₹{spent.toLocaleString()} spent</span>
              <span>₹{amount.toLocaleString()} left</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${spentPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full rounded-full", getProgressColor(spentPercentage, true))}
              />
            </div>
          </div>
        )}

        {/* Monthly Contribution Hint */}
        {monthlyContribution && monthlyContribution > 0 && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-blue-600">
            <TrendingUp className="w-3 h-3" />
            <span>+{formatCompact(monthlyContribution)}/month</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
