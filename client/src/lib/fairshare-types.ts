// FairShare Types - Couples Expense & Reward System

export interface MonthlySummary {
    userId: string;
    userName: string;
    month: string; // YYYY-MM format
    income: number;
    totalSpent: number;
    savings: number;
    savingsRate: number; // percentage 0-100
    sharedSpent: number;
    personalSpent: number;
    savingsGoal?: number;
}

export interface CoupleComparison {
    month: string;
    user: MonthlySummary;
    partner: MonthlySummary;
    absoluteDifferenceSpent: number;
    relativeDifferencePct: number;
    whoSavedMore: 'user' | 'partner' | 'equal';
    whoSpentMore: 'user' | 'partner' | 'equal';
    fairnessIndex: number; // 0-100
}

export interface PointsBreakdown {
    pointsSave: number; // 1 point per % saved
    pointsLowerSpender: number; // 1 point per ₹1000 less than partner
    pointsGoal: number; // 10 points if goal met
    total: number;
}

export interface RewardTier {
    id: 'bronze' | 'silver' | 'gold';
    name: string;
    minPoints: number;
    suggestedTrip: string;
    estimatedBudget: number;
    icon: string;
}

export interface FairShareSettings {
    rewardPolicy: 'auto' | 'mutual-approval';
    pointConversionRate: number; // 1 point = ₹X
    rewardRecipientRule: 'lower_spender' | 'higher_saver' | 'both';
    rewardFloor: number; // min points to unlock rewards
    partnerName: string;
    partnerAvatar?: string;
}

export interface FairShareState {
    currentMonth: string;
    userSummary: MonthlySummary;
    partnerSummary: MonthlySummary;
    comparison: CoupleComparison;
    currentPoints: PointsBreakdown;
    cumulativePoints: number;
    currentTier: RewardTier | null;
    settings: FairShareSettings;
}

// Reward tier definitions
export const REWARD_TIERS: RewardTier[] = [
    {
        id: 'bronze',
        name: 'Bronze',
        minPoints: 30,
        suggestedTrip: 'Local Weekend Getaway',
        estimatedBudget: 5000,
        icon: '🥉'
    },
    {
        id: 'silver',
        name: 'Silver',
        minPoints: 70,
        suggestedTrip: '2-Day State Trip',
        estimatedBudget: 12000,
        icon: '🥈'
    },
    {
        id: 'gold',
        name: 'Gold',
        minPoints: 150,
        suggestedTrip: '4-Day Dream Vacation',
        estimatedBudget: 35000,
        icon: '🥇'
    }
];

// Default settings
export const DEFAULT_FAIRSHARE_SETTINGS: FairShareSettings = {
    rewardPolicy: 'mutual-approval',
    pointConversionRate: 200, // 1 point = ₹200
    rewardRecipientRule: 'both',
    rewardFloor: 30,
    partnerName: 'Partner'
};
