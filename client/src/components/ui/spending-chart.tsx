import React from 'react';
import { cn } from '@/lib/utils';

interface SpendingChartProps {
    data: {
        day: string;
        amount: number;
        label: string;
    }[];
    maxAmount?: number;
    className?: string;
}

export function SpendingChart({ data, maxAmount, className }: SpendingChartProps) {
    const max = maxAmount || Math.max(...data.map(d => d.amount), 1);

    return (
        <div className={cn("bg-white rounded-2xl p-4 border border-gray-100 shadow-sm", className)}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-800">This Week's Spending</h3>
                <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>

            <div className="flex items-end justify-between gap-2 h-28">
                {data.map((item, index) => {
                    const height = max > 0 ? (item.amount / max) * 100 : 0;
                    const isToday = index === data.length - 1;

                    return (
                        <div key={item.day} className="flex flex-col items-center flex-1">
                            <div className="relative w-full flex justify-center mb-1">
                                {item.amount > 0 && (
                                    <span className="text-[9px] text-gray-500 font-medium absolute -top-4">
                                        ₹{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount}
                                    </span>
                                )}
                                <div
                                    className={cn(
                                        "w-6 rounded-t-md transition-all duration-500 ease-out",
                                        isToday
                                            ? "bg-gradient-to-t from-emerald-500 to-teal-400"
                                            : "bg-gradient-to-t from-gray-200 to-gray-300",
                                        height === 0 && "bg-gray-100"
                                    )}
                                    style={{ height: `${Math.max(height, 4)}%` }}
                                />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium mt-1",
                                isToday ? "text-emerald-600" : "text-gray-500"
                            )}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Category breakdown donut-style mini chart
interface CategoryBreakdownProps {
    categories: {
        name: string;
        amount: number;
        color: string;
        icon: string;
    }[];
    total: number;
    className?: string;
}

export function CategoryBreakdown({ categories, total, className }: CategoryBreakdownProps) {
    // Sort by amount and take top 5
    const topCategories = [...categories].sort((a, b) => b.amount - a.amount).slice(0, 5);

    return (
        <div className={cn("bg-white rounded-2xl p-4 border border-gray-100 shadow-sm", className)}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-800">Top Categories</h3>
                <span className="text-xs text-emerald-600 font-medium">This Month</span>
            </div>

            <div className="space-y-3">
                {topCategories.map((cat) => {
                    const percentage = total > 0 ? (cat.amount / total) * 100 : 0;

                    return (
                        <div key={cat.name} className="flex items-center gap-3">
                            <span className="text-lg">{cat.icon}</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-700">{cat.name}</span>
                                    <span className="text-xs font-bold text-gray-800">₹{(cat.amount / 100).toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-500", cat.color)}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {categories.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                        No spending yet this month
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple income vs expense comparison
interface IncomeExpenseComparisonProps {
    income: number;
    expense: number;
    className?: string;
}

export function IncomeExpenseComparison({ income, expense, className }: IncomeExpenseComparisonProps) {
    const total = income + expense;
    const incomePercent = total > 0 ? (income / total) * 100 : 50;
    const expensePercent = total > 0 ? (expense / total) * 100 : 50;
    const savings = income - expense;

    return (
        <div className={cn("bg-white rounded-2xl p-4 border border-gray-100 shadow-sm", className)}>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-800">Income vs Expense</h3>
                <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    savings >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                    {savings >= 0 ? '+' : ''}₹{Math.abs(savings / 100).toLocaleString()}
                </span>
            </div>

            {/* Stacked bar */}
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                    className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                    style={{ width: `${incomePercent}%` }}
                />
                <div
                    className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                    style={{ width: `${expensePercent}%` }}
                />
            </div>

            {/* Legend */}
            <div className="flex justify-between mt-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-600">Income</span>
                    <span className="text-xs font-bold text-green-600">₹{(income / 100).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-600">Expense</span>
                    <span className="text-xs font-bold text-red-600">₹{(expense / 100).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
