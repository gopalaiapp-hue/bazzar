import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plane, Gift, Star } from 'lucide-react';
import type { RewardTier } from '@/lib/fairshare-types';
import { formatCurrency } from '@/lib/fairshare-utils';

interface RewardTierCardProps {
    currentTier: RewardTier | null;
    cumulativePoints: number;
    nextTier: RewardTier | null;
    pointsToNextTier: number;
    progressPct: number;
    onClaimReward?: () => void;
    className?: string;
}

export function RewardTierCard({
    currentTier,
    cumulativePoints,
    nextTier,
    pointsToNextTier,
    progressPct,
    onClaimReward,
    className
}: RewardTierCardProps) {
    const getTierGradient = (tier: RewardTier | null) => {
        if (!tier) return 'from-gray-100 to-gray-200';
        switch (tier.id) {
            case 'bronze': return 'from-amber-100 to-orange-200';
            case 'silver': return 'from-slate-100 to-gray-300';
            case 'gold': return 'from-yellow-100 to-amber-300';
            default: return 'from-gray-100 to-gray-200';
        }
    };

    const getTierTextColor = (tier: RewardTier | null) => {
        if (!tier) return 'text-gray-600';
        switch (tier.id) {
            case 'bronze': return 'text-amber-800';
            case 'silver': return 'text-slate-700';
            case 'gold': return 'text-amber-700';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className={cn(
            "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
            className
        )}>
            {/* Current Tier Banner */}
            <div className={cn(
                "p-5 bg-gradient-to-r",
                getTierGradient(currentTier)
            )}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-600 mb-1">Current Tier</p>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl">{currentTier?.icon || '🎯'}</span>
                            <span className={cn("text-xl font-black", getTierTextColor(currentTier))}>
                                {currentTier?.name || 'No Tier Yet'}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-600 font-medium">Your Points</p>
                        <p className={cn("text-2xl font-black", getTierTextColor(currentTier))}>
                            {cumulativePoints}
                        </p>
                    </div>
                </div>
            </div>

            {/* Suggested Trip */}
            {currentTier && (
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Plane className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Suggested Trip</p>
                            <p className="text-sm font-bold text-gray-900">{currentTier.suggestedTrip}</p>
                            <p className="text-xs text-green-600 font-medium">
                                Budget: {formatCurrency(currentTier.estimatedBudget)}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={onClaimReward}
                            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-md"
                        >
                            <Gift className="w-4 h-4 mr-1" />
                            Claim
                        </Button>
                    </div>
                </div>
            )}

            {/* Next Tier Progress */}
            {nextTier && (
                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs font-medium text-gray-600">
                                Next: {nextTier.icon} {nextTier.name}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-purple-600">
                            {pointsToNextTier} pts to go
                        </span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                    <p className="text-[10px] text-gray-400 mt-1 text-center">
                        Unlock {nextTier.suggestedTrip}!
                    </p>
                </div>
            )}

            {/* Max tier message */}
            {!nextTier && currentTier && (
                <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-600">
                        <Star className="w-5 h-5 fill-amber-400" />
                        <span className="text-sm font-bold">You've reached the top tier!</span>
                        <Star className="w-5 h-5 fill-amber-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Keep earning points for more rewards
                    </p>
                </div>
            )}

            {/* No tier yet message */}
            {!currentTier && (
                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">
                            First tier: 🥉 Bronze
                        </span>
                        <span className="text-xs font-bold text-purple-600">
                            {30 - cumulativePoints} pts to go
                        </span>
                    </div>
                    <Progress value={(cumulativePoints / 30) * 100} className="h-2" />
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        Start saving together to unlock your first trip! ✈️
                    </p>
                </div>
            )}
        </div>
    );
}
