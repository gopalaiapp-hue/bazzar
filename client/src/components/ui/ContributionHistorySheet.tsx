import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";
import { Button } from "./button";
import { History, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GoalContribution } from "@shared/schema";

interface ContributionHistorySheetProps {
    isOpen: boolean;
    onClose: () => void;
    goalName: string;
    contributions: GoalContribution[];
}

export function ContributionHistorySheet({
    isOpen,
    onClose,
    goalName,
    contributions,
}: ContributionHistorySheetProps) {
    const { t } = useTranslation();

    // Format currency
    const formatCurrency = (amount: number) => {
        return (amount / 100).toLocaleString('en-IN');
    };

    // Group contributions by month
    const groupedContributions = contributions.reduce((acc, contribution) => {
        const date = new Date(contribution.createdAt!);
        const monthYear = date.toLocaleDateString("en-IN", { month: 'long', year: 'numeric' });

        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(contribution);
        return acc;
    }, {} as Record<string, GoalContribution[]>);

    // Calculate total
    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                            <History className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-left">
                            <SheetTitle className="text-lg font-bold">
                                {t('goals.contributionHistory', 'Contribution History')}
                            </SheetTitle>
                            <p className="text-sm text-muted-foreground">{goalName}</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Total Summary */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-medium mb-1">
                            {t('goals.totalContributed', 'Total Contributed')}
                        </p>
                        <p className="text-3xl font-bold text-emerald-800">
                            ₹{formatCurrency(totalContributed)}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
                            from {contributions.length} {contributions.length === 1 ? 'contribution' : 'contributions'}
                        </p>
                    </div>

                    {/* Grouped Contributions */}
                    {Object.keys(groupedContributions).length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(groupedContributions).map(([monthYear, items]) => (
                                <div key={monthYear}>
                                    <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {monthYear}
                                    </h3>
                                    <div className="space-y-2">
                                        {items.map((contribution) => (
                                            <div
                                                key={contribution.id}
                                                className="bg-white border border-gray-200 p-4 rounded-xl"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="text-lg font-bold text-gray-800">
                                                            ₹{formatCurrency(contribution.amount)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            via {contribution.source}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(contribution.createdAt!).toLocaleDateString("en-IN", {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                {contribution.note && (
                                                    <div className="bg-gray-50 px-3 py-2 rounded-lg mt-2">
                                                        <p className="text-xs text-gray-600">
                                                            📝 {contribution.note}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No contributions yet
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t pt-4 pb-2">
                    <Button variant="ghost" onClick={onClose} className="w-full">
                        Close
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
