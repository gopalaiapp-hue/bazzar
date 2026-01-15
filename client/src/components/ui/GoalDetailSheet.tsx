import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";
import { Button } from "./button";
import { Progress } from "./progress";
import { TrendingUp, Calendar, Target, History, Edit2, Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Goal, GoalContribution } from "@shared/schema";
import { cn } from "@/lib/utils";

interface GoalDetailSheetProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal | null;
    contributions: GoalContribution[];
    onAddFunds: () => void;
    onEdit?: (goal: Goal) => void;
    onDelete?: (goalId: number) => void;
    onViewAllContributions?: () => void;
}

export function GoalDetailSheet({
    isOpen,
    onClose,
    goal,
    contributions = [],
    onAddFunds,
    onEdit,
    onDelete,
    onViewAllContributions,
}: GoalDetailSheetProps) {
    const { t } = useTranslation();

    if (!goal) return null;

    const progress = Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100);
    const remaining = goal.targetAmount - (goal.currentAmount || 0);
    const isCompleted = progress >= 100;

    // Calculate days remaining
    const daysRemaining = goal.deadline
        ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    const isOverdue = daysRemaining !== null && daysRemaining < 0;

    // Get motivational message
    const getMotivationalMessage = () => {
        if (isCompleted) return "🎉 Goal Completed!";
        if (isOverdue) return `⚠️ Overdue by ${Math.abs(daysRemaining!)} days`;
        if (daysRemaining && daysRemaining <= 7) return `⏰ Only ${daysRemaining} days left!`;
        if (progress > 75) return "🔥 Almost there!";
        if (progress > 50) return "💪 Great progress!";
        if (progress > 25) return "🎯 On track";
        return "🌱 Just getting started";
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return (amount / 100).toLocaleString('en-IN');
    };

    // Get recent contributions (last 5)
    const recentContributions = contributions.slice(0, 5);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
                <SheetHeader className="pb-4 border-b">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <SheetTitle className="text-xl font-bold">{goal.name}</SheetTitle>
                                {goal.isPriority && (
                                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                                        Priority
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Target: ₹{formatCurrency(goal.targetAmount)}
                                {goal.deadline && ` by ${new Date(goal.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`}
                            </p>
                        </div>
                        <div className="text-4xl">{goal.icon || '🎯'}</div>
                    </div>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Progress Section */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border border-emerald-100">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <p className="text-2xl font-bold text-emerald-800">
                                    ₹{formatCurrency(goal.currentAmount || 0)}
                                </p>
                                <p className="text-xs text-emerald-600">saved so far</p>
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "text-3xl font-bold",
                                    isCompleted ? "text-green-600" : "text-gray-700"
                                )}>
                                    {progress}%
                                </p>
                            </div>
                        </div>
                        <Progress
                            value={Math.min(progress, 100)}
                            className="h-3 bg-white"
                        />
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-sm font-medium text-emerald-700">
                                {isCompleted ? "🎉 Goal achieved!" : `₹${formatCurrency(remaining)} left to reach your goal`}
                            </p>
                            {daysRemaining !== null && !isCompleted && (
                                <p className={cn(
                                    "text-xs font-medium",
                                    isOverdue ? "text-red-600" : "text-emerald-600"
                                )}>
                                    {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Motivational Badge */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex gap-3 items-center">
                            <TrendingUp className={cn(
                                "w-5 h-5",
                                isCompleted ? "text-green-600" : isOverdue ? "text-red-600" : "text-blue-600"
                            )} />
                            <div>
                                <p className="text-sm font-semibold">{getMotivationalMessage()}</p>
                                <p className="text-xs text-muted-foreground">
                                    {isCompleted
                                        ? "Congratulations on achieving your goal!"
                                        : "Keep saving to reach your goal"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Last Contribution */}
                    {goal.lastContributionDate && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                            <p className="text-xs text-blue-700 font-medium mb-1">
                                📅 Last Contribution
                            </p>
                            <p className="text-sm text-blue-800">
                                {new Date(goal.lastContributionDate).toLocaleDateString("en-IN", {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    )}

                    {/* Recent Contributions */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <History className="w-4 h-4" />
                                {t('goals.contributionHistory', 'Contribution History')}
                            </h3>
                            {contributions.length > 5 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onViewAllContributions}
                                    className="text-xs"
                                >
                                    View All ({contributions.length})
                                </Button>
                            )}
                        </div>

                        {contributions.length > 0 ? (
                            <div className="space-y-2">
                                {recentContributions.map((contribution) => (
                                    <div
                                        key={contribution.id}
                                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                ₹{formatCurrency(contribution.amount)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                via {contribution.source}
                                                {contribution.note && ` • ${contribution.note}`}
                                            </p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(contribution.createdAt!).toLocaleDateString("en-IN", {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <History className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('goals.noContributions', "You haven't added money yet. Start with any amount.")}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                        <Button
                            onClick={() => {
                                onClose();
                                onAddFunds();
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={isCompleted}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('goals.addFunds', 'Add Funds')}
                        </Button>

                        <div className="flex gap-2">
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        onClose();
                                        onEdit(goal);
                                    }}
                                    className="flex-1"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (confirm(`Are you sure you want to delete "${goal.name}"?`)) {
                                            onClose();
                                            onDelete(goal.id);
                                        }
                                    }}
                                    className="flex-1 text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            )}
                        </div>

                        <Button variant="ghost" onClick={onClose} className="w-full">
                            Close
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
