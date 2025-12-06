import React from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface FairnessScoreCardProps {
    score: number; // 0-100
    className?: string;
}

export function FairnessScoreCard({ score, className }: FairnessScoreCardProps) {
    // Determine color and message based on score
    const getScoreDetails = () => {
        if (score >= 80) {
            return {
                color: 'text-green-600',
                bgColor: 'bg-green-500',
                message: 'Excellent balance! 💚',
                description: 'Great job maintaining fairness in your spending.'
            };
        } else if (score >= 60) {
            return {
                color: 'text-blue-600',
                bgColor: 'bg-blue-500',
                message: 'Good balance 👍',
                description: 'Minor adjustments could improve fairness.'
            };
        } else if (score >= 40) {
            return {
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-500',
                message: 'Needs attention ⚠️',
                description: 'Consider discussing spending patterns.'
            };
        } else {
            return {
                color: 'text-red-600',
                bgColor: 'bg-red-500',
                message: 'Needs work 🔴',
                description: 'Significant imbalance detected. Time to talk!'
            };
        }
    };

    const details = getScoreDetails();
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className={cn(
            "bg-white p-6 rounded-2xl border border-gray-100 shadow-sm",
            className
        )}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    Fairness Score
                </h3>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] p-3">
                            <p className="text-xs">
                                Fairness Score measures how balanced your spending is as a couple.
                                It considers shared expenses, savings rates, and income-proportional contributions.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="56"
                            cy="56"
                            r="45"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="56"
                            cy="56"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            className={details.color}
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: strokeDashoffset,
                                transition: 'stroke-dashoffset 0.5s ease-in-out'
                            }}
                        />
                    </svg>
                    {/* Score text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn("text-3xl font-black", details.color)}>{score}</span>
                        <span className="text-[10px] text-gray-400 font-medium">/100</span>
                    </div>
                </div>

                {/* Message */}
                <div className="flex-1">
                    <p className={cn("text-lg font-bold mb-1", details.color)}>
                        {details.message}
                    </p>
                    <p className="text-xs text-gray-500">
                        {details.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
