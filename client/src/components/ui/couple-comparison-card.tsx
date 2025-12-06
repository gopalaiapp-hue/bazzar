import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatCurrencyShort } from '@/lib/fairshare-utils';
import type { CoupleComparison } from '@/lib/fairshare-types';
import { TrendingUp, TrendingDown, Equal } from 'lucide-react';

interface CoupleComparisonCardProps {
    comparison: CoupleComparison;
    userAvatar?: string;
    partnerAvatar?: string;
    className?: string;
}

export function CoupleComparisonCard({
    comparison,
    userAvatar,
    partnerAvatar,
    className
}: CoupleComparisonCardProps) {
    const { user, partner, whoSpentMore, absoluteDifferenceSpent } = comparison;

    const getSpendIndicator = () => {
        if (whoSpentMore === 'equal') {
            return { icon: Equal, text: 'Equal spending! 🎉', color: 'text-green-600' };
        } else if (whoSpentMore === 'user') {
            return {
                icon: TrendingUp,
                text: `You spent ${formatCurrencyShort(absoluteDifferenceSpent)} more`,
                color: 'text-orange-600'
            };
        } else {
            return {
                icon: TrendingDown,
                text: `${partner.userName} spent ${formatCurrencyShort(absoluteDifferenceSpent)} more`,
                color: 'text-blue-600'
            };
        }
    };

    const indicator = getSpendIndicator();
    const IconComponent = indicator.icon;

    return (
        <div className={cn(
            "bg-white p-6 rounded-2xl border border-pink-100 shadow-lg relative overflow-hidden",
            className
        )}>
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-red-500" />

            {/* Header */}
            <h2 className="text-sm font-bold text-pink-600 uppercase tracking-wider mb-4 text-center">
                This Month's Spending
            </h2>

            {/* Partner comparison */}
            <div className="flex justify-center gap-8">
                {/* User */}
                <div className="flex flex-col items-center">
                    <Avatar className="h-14 w-14 border-3 border-blue-200 mb-2 shadow-md">
                        {userAvatar && <AvatarImage src={userAvatar} />}
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                            {user.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-gray-600">You Spent</span>
                    <span className={cn(
                        "text-lg font-bold mt-1",
                        whoSpentMore === 'user' ? 'text-orange-600' : 'text-gray-900'
                    )}>
                        {formatCurrencyShort(user.totalSpent)}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                        Saved {formatCurrencyShort(user.savings)}
                    </span>
                </div>

                {/* Divider */}
                <div className="h-20 w-[1px] bg-gradient-to-b from-pink-200 via-gray-200 to-pink-200 self-center" />

                {/* Partner */}
                <div className="flex flex-col items-center">
                    <Avatar className="h-14 w-14 border-3 border-pink-200 mb-2 shadow-md">
                        {partnerAvatar && <AvatarImage src={partnerAvatar} />}
                        <AvatarFallback className="bg-pink-100 text-pink-700 font-bold">
                            {partner.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-gray-600">{partner.userName} Spent</span>
                    <span className={cn(
                        "text-lg font-bold mt-1",
                        whoSpentMore === 'partner' ? 'text-orange-600' : 'text-pink-600'
                    )}>
                        {formatCurrencyShort(partner.totalSpent)}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                        Saved {formatCurrencyShort(partner.savings)}
                    </span>
                </div>
            </div>

            {/* Spending indicator */}
            <div className={cn(
                "mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-bold",
                whoSpentMore === 'equal'
                    ? 'bg-green-50 text-green-700'
                    : whoSpentMore === 'user'
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-blue-50 text-blue-700'
            )}>
                <IconComponent className="w-4 h-4" />
                <span>{indicator.text}</span>
            </div>
        </div>
    );
}
