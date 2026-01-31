import React from 'react';
import { cn } from '@/lib/utils';
import {
    Wallet,
    Receipt,
    Target,
    TrendingUp,
    PiggyBank,
    CreditCard,
    CalendarCheck,
    Users
} from 'lucide-react';

interface EmptyStateProps {
    type: 'transactions' | 'pockets' | 'goals' | 'budgets' | 'subscriptions' | 'family';
    title?: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

const emptyStateConfig = {
    transactions: {
        icon: Receipt,
        emoji: '📝',
        title: 'No Transactions Yet',
        description: 'Start tracking your spending by adding your first transaction',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
    },
    pockets: {
        icon: Wallet,
        emoji: '👛',
        title: 'No Pockets Created',
        description: 'Create pockets to organize your savings for different goals',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
    },
    goals: {
        icon: Target,
        emoji: '🎯',
        title: 'No Goals Set',
        description: 'Set financial goals and track your progress towards them',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50',
    },
    budgets: {
        icon: PiggyBank,
        emoji: '💰',
        title: 'No Budgets Set',
        description: 'Create budgets to control your spending in different categories',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
    },
    subscriptions: {
        icon: CreditCard,
        emoji: '📅',
        title: 'No Subscriptions',
        description: 'Track your recurring subscriptions like Netflix, Spotify, etc.',
        color: 'text-pink-500',
        bgColor: 'bg-pink-50',
    },
    family: {
        icon: Users,
        emoji: '👨‍👩‍👧‍👦',
        title: 'No Family Members',
        description: 'Add family members to share and track expenses together',
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50',
    },
};

export function EmptyState({ type, title, description, action, className }: EmptyStateProps) {
    const config = emptyStateConfig[type];
    const Icon = config.icon;

    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 px-6 text-center",
            className
        )}>
            {/* Animated Icon Container */}
            <div className={cn(
                "relative w-24 h-24 rounded-full flex items-center justify-center mb-6",
                "animate-pulse",
                config.bgColor
            )}>
                {/* Background rings */}
                <div className={cn(
                    "absolute inset-0 rounded-full opacity-30",
                    config.bgColor
                )} style={{ transform: 'scale(1.3)' }} />
                <div className={cn(
                    "absolute inset-0 rounded-full opacity-20",
                    config.bgColor
                )} style={{ transform: 'scale(1.6)' }} />

                {/* Main emoji/icon */}
                <span className="text-4xl z-10">{config.emoji}</span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-800 mb-2">
                {title || config.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
                {description || config.description}
            </p>

            {/* Action Button */}
            {action && (
                <div className="animate-bounce-subtle">
                    {action}
                </div>
            )}
        </div>
    );
}

// Compact inline empty state for lists
export function EmptyStateInline({
    message,
    emoji = '📭',
    className
}: {
    message: string;
    emoji?: string;
    className?: string;
}) {
    return (
        <div className={cn(
            "flex items-center justify-center gap-3 py-8 px-4 text-center",
            "bg-gray-50/50 rounded-xl border border-dashed border-gray-200",
            className
        )}>
            <span className="text-2xl">{emoji}</span>
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

// Motivational empty state with tips
export function EmptyStateWithTips({
    type,
    tips,
    action,
    className
}: {
    type: keyof typeof emptyStateConfig;
    tips: string[];
    action?: React.ReactNode;
    className?: string;
}) {
    const config = emptyStateConfig[type];

    return (
        <div className={cn(
            "flex flex-col items-center py-8 px-4",
            className
        )}>
            <span className="text-5xl mb-4">{config.emoji}</span>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{config.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{config.description}</p>

            {/* Tips */}
            <div className="w-full max-w-xs space-y-2 mb-6">
                {tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 text-left">
                        <span className="text-green-500 text-sm">✓</span>
                        <span className="text-xs text-gray-600">{tip}</span>
                    </div>
                ))}
            </div>

            {action}
        </div>
    );
}
