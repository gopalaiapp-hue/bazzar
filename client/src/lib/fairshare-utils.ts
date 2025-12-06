// FairShare Calculation Utilities

import type {
    MonthlySummary,
    CoupleComparison,
    PointsBreakdown,
    RewardTier,
    REWARD_TIERS
} from './fairshare-types';

/**
 * Format amount as Indian Rupees
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format amount in short form (e.g., ₹1.2L, ₹45K)
 */
export function formatCurrencyShort(amount: number): string {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
}

/**
 * Calculate savings rate as percentage
 */
export function calculateSavingsRate(income: number, spent: number): number {
    if (income <= 0) return 0;
    const savings = income - spent;
    return Math.max(0, Math.min(100, (savings / income) * 100));
}

/**
 * Calculate FairShare points for a user based on scoring algorithm
 * 
 * Scoring:
 * - points_save: 1 point per % saved (floor)
 * - points_lower_spender: 1 point per ₹1000 less than partner
 * - points_goal: 10 points if savings >= savings goal
 */
export function calculatePoints(
    userSummary: MonthlySummary,
    partnerSummary: MonthlySummary
): PointsBreakdown {
    // Points for saving (1 point per % saved)
    const pointsSave = Math.floor(userSummary.savingsRate);

    // Points for being lower spender (1 point per ₹1000 difference)
    const spendDiff = partnerSummary.totalSpent - userSummary.totalSpent;
    const pointsLowerSpender = spendDiff > 0 ? Math.ceil(spendDiff / 1000) : 0;

    // Goal achievement bonus (10 points if met)
    const pointsGoal =
        userSummary.savingsGoal && userSummary.savings >= userSummary.savingsGoal
            ? 10
            : 0;

    return {
        pointsSave,
        pointsLowerSpender,
        pointsGoal,
        total: pointsSave + pointsLowerSpender + pointsGoal
    };
}

/**
 * Calculate fairness index (0-100) between two partners
 * 
 * Components (weighted):
 * - Equal-share deviation for shared expenses (30%)
 * - Savings-rate difference (40%)
 * - Income-weighted contribution fairness (30%)
 */
export function calculateFairnessIndex(
    userSummary: MonthlySummary,
    partnerSummary: MonthlySummary
): number {
    // 1. Shared expense fairness (30% weight)
    // Ideal: 50-50 split. Measure deviation from equal.
    const totalShared = userSummary.sharedSpent + partnerSummary.sharedSpent;
    let sharedFairness = 100;
    if (totalShared > 0) {
        const userSharePct = (userSummary.sharedSpent / totalShared) * 100;
        const deviationFromEqual = Math.abs(50 - userSharePct);
        sharedFairness = Math.max(0, 100 - deviationFromEqual * 2); // 0-100
    }

    // 2. Savings rate difference (40% weight)
    // Smaller difference = better
    const savingsRateDiff = Math.abs(userSummary.savingsRate - partnerSummary.savingsRate);
    const savingsFairness = Math.max(0, 100 - savingsRateDiff * 2);

    // 3. Income-weighted contribution (30% weight)
    // Each should contribute proportionally to income
    const totalIncome = userSummary.income + partnerSummary.income;
    let contributionFairness = 100;
    if (totalIncome > 0) {
        const expectedUserContrib = (userSummary.income / totalIncome) * 100;
        const totalSpent = userSummary.totalSpent + partnerSummary.totalSpent;
        const actualUserContrib = totalSpent > 0
            ? (userSummary.totalSpent / totalSpent) * 100
            : 50;
        const contribDeviation = Math.abs(expectedUserContrib - actualUserContrib);
        contributionFairness = Math.max(0, 100 - contribDeviation * 2);
    }

    // Weighted average
    const fairnessIndex = Math.round(
        sharedFairness * 0.3 +
        savingsFairness * 0.4 +
        contributionFairness * 0.3
    );

    return Math.max(0, Math.min(100, fairnessIndex));
}

/**
 * Get reward tier based on cumulative points
 */
export function getRewardTier(
    cumulativePoints: number,
    tiers: RewardTier[]
): RewardTier | null {
    // Sort descending by minPoints to find highest qualifying tier
    const sortedTiers = [...tiers].sort((a, b) => b.minPoints - a.minPoints);

    for (const tier of sortedTiers) {
        if (cumulativePoints >= tier.minPoints) {
            return tier;
        }
    }

    return null;
}

/**
 * Get progress towards next tier
 */
export function getNextTierProgress(
    cumulativePoints: number,
    tiers: RewardTier[]
): { nextTier: RewardTier | null; pointsNeeded: number; progressPct: number } {
    const sortedTiers = [...tiers].sort((a, b) => a.minPoints - b.minPoints);

    for (const tier of sortedTiers) {
        if (cumulativePoints < tier.minPoints) {
            const previousTierMin = sortedTiers[sortedTiers.indexOf(tier) - 1]?.minPoints || 0;
            const pointsNeeded = tier.minPoints - cumulativePoints;
            const range = tier.minPoints - previousTierMin;
            const progressPct = ((cumulativePoints - previousTierMin) / range) * 100;

            return { nextTier: tier, pointsNeeded, progressPct: Math.min(100, progressPct) };
        }
    }

    // Already at max tier
    return { nextTier: null, pointsNeeded: 0, progressPct: 100 };
}

/**
 * Compare two partners and return comparison metrics
 */
export function comparePartners(
    userSummary: MonthlySummary,
    partnerSummary: MonthlySummary
): CoupleComparison {
    const absoluteDifferenceSpent = Math.abs(
        userSummary.totalSpent - partnerSummary.totalSpent
    );

    const maxSpent = Math.max(userSummary.totalSpent, partnerSummary.totalSpent);
    const relativeDifferencePct = maxSpent > 0
        ? ((userSummary.totalSpent - partnerSummary.totalSpent) / maxSpent) * 100
        : 0;

    let whoSavedMore: 'user' | 'partner' | 'equal' = 'equal';
    if (userSummary.savingsRate > partnerSummary.savingsRate + 1) {
        whoSavedMore = 'user';
    } else if (partnerSummary.savingsRate > userSummary.savingsRate + 1) {
        whoSavedMore = 'partner';
    }

    let whoSpentMore: 'user' | 'partner' | 'equal' = 'equal';
    if (userSummary.totalSpent > partnerSummary.totalSpent + 500) {
        whoSpentMore = 'user';
    } else if (partnerSummary.totalSpent > userSummary.totalSpent + 500) {
        whoSpentMore = 'partner';
    }

    return {
        month: userSummary.month,
        user: userSummary,
        partner: partnerSummary,
        absoluteDifferenceSpent,
        relativeDifferencePct: Math.round(relativeDifferencePct),
        whoSavedMore,
        whoSpentMore,
        fairnessIndex: calculateFairnessIndex(userSummary, partnerSummary)
    };
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Generate mock partner data based on user's data with some variation
 */
export function generateMockPartnerSummary(
    userSummary: MonthlySummary,
    partnerName: string = 'Partner'
): MonthlySummary {
    // Add some random variation (±20%)
    const variation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2

    const partnerIncome = Math.round(userSummary.income * (0.7 + Math.random() * 0.6)); // 70-130%
    const partnerSpent = Math.round(userSummary.totalSpent * variation);
    const partnerSavings = partnerIncome - partnerSpent;

    return {
        userId: 'partner',
        userName: partnerName,
        month: userSummary.month,
        income: partnerIncome,
        totalSpent: partnerSpent,
        savings: partnerSavings,
        savingsRate: calculateSavingsRate(partnerIncome, partnerSpent),
        sharedSpent: Math.round(partnerSpent * 0.4), // ~40% shared
        personalSpent: Math.round(partnerSpent * 0.6),
        savingsGoal: userSummary.savingsGoal
    };
}

/**
 * Load FairShare data from localStorage
 */
export function loadFairShareData(userId: string): {
    cumulativePoints: number;
    monthlyHistory: { month: string; points: number }[];
    settings: any;
} {
    const key = `fairshare_${userId}`;
    const stored = localStorage.getItem(key);

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            // Invalid data, return defaults
        }
    }

    return {
        cumulativePoints: 0,
        monthlyHistory: [],
        settings: null
    };
}

/**
 * Save FairShare data to localStorage
 */
export function saveFairShareData(
    userId: string,
    data: {
        cumulativePoints: number;
        monthlyHistory: { month: string; points: number }[];
        settings: any;
    }
): void {
    const key = `fairshare_${userId}`;
    localStorage.setItem(key, JSON.stringify(data));
}
