import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Sparkles, Target, TrendingDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { PointsBreakdown } from '@/lib/fairshare-types';

interface PointsCardProps {
    currentPoints: PointsBreakdown;
    cumulativePoints: number;
    className?: string;
}

export function PointsCard({
    currentPoints,
    cumulativePoints,
    className
}: PointsCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn(
            "bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100 shadow-sm",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center shadow-md">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-purple-900">FairShare Points</h3>
                        <p className="text-[10px] text-purple-600">Earn trips by saving together!</p>
                    </div>
                </div>
            </div>

            {/* Points Display */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/60 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-purple-700 uppercase font-bold mb-1">This Month</p>
                    <p className="text-2xl font-black text-purple-900">{currentPoints.total}</p>
                    <p className="text-[10px] text-purple-500">points</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-purple-100">
                    <p className="text-[10px] text-indigo-700 uppercase font-bold mb-1">Total</p>
                    <p className="text-2xl font-black text-indigo-900">{cumulativePoints}</p>
                    <p className="text-[10px] text-indigo-500">cumulative</p>
                </div>
            </div>

            {/* Points Breakdown */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingDown className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-600">Savings Bonus</span>
                    </div>
                    <span className="font-bold text-green-600">+{currentPoints.pointsSave}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-gray-600">Lower Spender Bonus</span>
                    </div>
                    <span className="font-bold text-blue-600">+{currentPoints.pointsLowerSpender}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Target className="w-3 h-3 text-yellow-600" />
                        </div>
                        <span className="text-gray-600">Goal Achievement</span>
                    </div>
                    <span className="font-bold text-yellow-600">+{currentPoints.pointsGoal}</span>
                </div>
            </div>

            {/* How it works collapsible */}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger className="flex items-center justify-center w-full py-2 text-xs text-purple-600 hover:text-purple-800 transition-colors">
                    <span className="font-medium">How Points Work</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="bg-white/80 rounded-lg p-3 mt-2 text-xs text-gray-600 space-y-2">
                        <p><strong>• Savings Bonus:</strong> 1 point per 1% of income saved</p>
                        <p><strong>• Lower Spender:</strong> 1 point per ₹1,000 less than partner</p>
                        <p><strong>• Goal Achievement:</strong> 10 bonus points when you hit your savings goal</p>
                        <p className="pt-2 border-t border-purple-100 text-purple-700 font-medium">
                            Collect points to unlock trip rewards! 🎁
                        </p>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
