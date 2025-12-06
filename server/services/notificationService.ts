import { db } from "../../db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import * as schema from "../../shared/schema";

interface NotificationContent {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
    actions?: Array<{ action: string; title: string }>;
}

interface DailyBriefSummary {
    userId: string;
    date: Date;
    totalSpent: number;
    totalIncome: number;
    topCategories: Array<{ category: string; amount: number }>;
    budgetStatus: Array<{ category: string; spent: number; limit: number; percentage: number }>;
    savingsTip?: string;
}

interface FamilyBriefSummary {
    hofId: string;
    date: Date;
    totalFamilySpent: number;
    perMemberSpending: Array<{ userId: string; name: string; amount: number }>;
    sharedExpenses: number;
    topSpenders: Array<{ name: string; amount: number }>;
    insight?: string;
}

export class NotificationService {
    // Generate daily brief for individual user
    async generatePersonalBrief(userId: string): Promise<NotificationContent> {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get yesterday's transactions
        const transactions = await db.select()
            .from(schema.transactions)
            .where(and(
                eq(schema.transactions.userId, userId),
                gte(schema.transactions.date, yesterday),
                lte(schema.transactions.date, today)
            ));

        const totalSpent = transactions
            .filter(t => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

        const totalIncome = transactions
            .filter(t => t.type === "credit")
            .reduce((sum, t) => sum + t.amount, 0);

        // Get top categories
        const categoryMap = new Map<string, number>();
        transactions.filter(t => t.type === "debit").forEach(t => {
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + t.amount);
        });

        const topCategories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category, amount]) => ({ category, amount }));

        // Get month-to-date spending
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthTransactions = await db.select()
            .from(schema.transactions)
            .where(and(
                eq(schema.transactions.userId, userId),
                gte(schema.transactions.date, monthStart)
            ));

        const monthSpent = monthTransactions
            .filter(t => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

        // Get budgets
        const currentMonth = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
        const budgets = await db.select()
            .from(schema.budgets)
            .where(and(
                eq(schema.budgets.userId, userId),
                eq(schema.budgets.month, currentMonth)
            ));

        const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
        const budgetPercentage = totalBudget > 0 ? Math.round((monthSpent / totalBudget) * 100) : 0;

        // Format notification
        // Get active goals
        const goals = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId));
        const goalsOnTrack = goals.filter(g => {
            if (!g.targetAmount || !g.currentAmount) return false;
            return (g.currentAmount / g.targetAmount) >= 0.5;
        }).length;

        // Format notification
        const topCatText = topCategories.length > 0
            ? `\nTop: ${topCategories.map(c => `${c.category} (₹${c.amount})`).join(', ')}`
            : '';

        const budgetText = totalBudget > 0
            ? `\nMonth: ${budgetPercentage}% budget used`
            : '';

        const goalsText = goals.length > 0 ? ` | ${goalsOnTrack} goals on track` : '';

        return {
            title: `📊 Daily Brief — ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
            body: `Yesterday: Spent ₹${totalSpent.toLocaleString()} | Income ₹${totalIncome.toLocaleString()}${budgetText}${goalsText}${topCatText}`,
            icon: '/logo.png',
            data: {
                type: 'daily_brief',
                userId,
                date: new Date().toISOString(),
                stats: {
                    spent: totalSpent,
                    income: totalIncome,
                    budgetUsed: budgetPercentage,
                    topCategories
                }
            }
        };
    }

    // Generate family brief for Head of Family
    async generateFamilyBrief(hofId: string): Promise<NotificationContent> {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all linked members
        const linkedMembers = await db.select()
            .from(schema.users)
            .where(eq(schema.users.linkedAdminId, hofId));

        const allUserIds = [hofId, ...linkedMembers.map(m => m.id)];

        // Get yesterday's transactions for all family members
        const allTransactions: any[] = [];
        for (const userId of allUserIds) {
            const txns = await db.select()
                .from(schema.transactions)
                .where(and(
                    eq(schema.transactions.userId, userId),
                    gte(schema.transactions.date, yesterday),
                    lte(schema.transactions.date, today)
                ));
            allTransactions.push(...txns.map(t => ({ ...t, userId })));
        }

        const totalSpent = allTransactions
            .filter(t => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

        const sharedSpent = allTransactions
            .filter(t => t.type === "debit" && t.isShared)
            .reduce((sum, t) => sum + t.amount, 0);

        // Per-member spending
        const memberSpending = new Map<string, { name: string; amount: number }>();

        for (const userId of allUserIds) {
            const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
            const userTxns = allTransactions.filter(t => t.userId === userId && t.type === "debit");
            const amount = userTxns.reduce((sum, t) => sum + t.amount, 0);

            if (user[0]) {
                memberSpending.set(userId, { name: user[0].name || 'Unknown', amount });
            }
        }

        const topSpenders = Array.from(memberSpending.values())
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3);

        // Month-to-date
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthTransactions: any[] = [];
        for (const userId of allUserIds) {
            const txns = await db.select()
                .from(schema.transactions)
                .where(and(
                    eq(schema.transactions.userId, userId),
                    gte(schema.transactions.date, monthStart)
                ));
            monthTransactions.push(...txns);
        }

        const monthTotal = monthTransactions
            .filter(t => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

        const sharedMonthly = monthTransactions
            .filter(t => t.type === "debit" && t.isShared)
            .reduce((sum, t) => sum + t.amount, 0);

        const sharedPercentage = monthTotal > 0 ? Math.round((sharedMonthly / monthTotal) * 100) : 0;

        // Format member breakdown
        const memberText = topSpenders.length > 0
            ? topSpenders.map(s => `- ${s.name}: ₹${s.amount.toLocaleString()}`).join('\n')
            : '';

        // New members joined yesterday
        const newMembers = linkedMembers.filter(m => {
            const joinedAt = new Date(m.createdAt || 0);
            return joinedAt >= yesterday && joinedAt <= today;
        });
        const newMembersText = newMembers.length > 0 ? `\nNew Members: ${newMembers.map(m => m.name).join(', ')}` : '';

        // Family Goals (HoF's priority goals)
        const familyGoals = await db.select().from(schema.goals)
            .where(and(
                eq(schema.goals.userId, hofId),
                eq(schema.goals.isPriority, true)
            ));
        const goalsOnTrack = familyGoals.filter(g => {
            if (!g.targetAmount || !g.currentAmount) return false;
            return (g.currentAmount / g.targetAmount) >= 0.5;
        }).length;
        const goalsText = familyGoals.length > 0 ? ` | ${goalsOnTrack} goals on track` : '';

        return {
            title: `👨‍👩‍👧‍👦 Family Brief — ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
            body: `Yesterday: ₹${totalSpent.toLocaleString()} (Shared: ₹${sharedSpent.toLocaleString()})\nTop: ${topSpenders[0]?.name || 'None'} (₹${topSpenders[0]?.amount.toLocaleString()})${newMembersText}${goalsText}\nMonth: ₹${monthTotal.toLocaleString()} (${sharedPercentage}% shared)`,
            icon: '/logo.png',
            data: {
                type: 'family_brief',
                hofId,
                date: new Date().toISOString(),
                stats: {
                    totalSpent,
                    sharedSpent,
                    topSpenders,
                    monthTotal,
                    sharedPercentage
                }
            }
        };
    }

    // Check budget alerts
    async checkBudgetAlerts(userId: string): Promise<NotificationContent[]> {
        const currentMonth = new Date();
        const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

        const budgets = await db.select()
            .from(schema.budgets)
            .where(and(
                eq(schema.budgets.userId, userId),
                eq(schema.budgets.month, monthKey)
            ));

        const alerts: NotificationContent[] = [];

        for (const budget of budgets) {
            const spent = budget.spent || 0;
            const usage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

            if (usage >= 90) {
                alerts.push({
                    title: '🚨 Budget Alert',
                    body: `You've used ${Math.round(usage)}% of your ${budget.category} budget\n₹${spent.toLocaleString()} / ₹${budget.limit.toLocaleString()} spent this month`,
                    icon: '/logo.png',
                    data: { type: 'budget_alert', budgetId: budget.id, category: budget.category, usage }
                });
            } else if (usage >= 75 && usage < 90) {
                alerts.push({
                    title: '⚠️ Budget Warning',
                    body: `You've used ${Math.round(usage)}% of your ${budget.category} budget\n₹${spent.toLocaleString()} / ₹${budget.limit.toLocaleString()}`,
                    icon: '/logo.png',
                    data: { type: 'budget_warning', budgetId: budget.id, category: budget.category, usage }
                });
            }
        }

        return alerts;
    }

    // Check Lena-Dena reminders
    async checkLenaDenaReminders(): Promise<Array<NotificationContent & { userId: string }>> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const upcomingDues = await db.select()
            .from(schema.lenaDena)
            .where(and(
                eq(schema.lenaDena.status, "pending"),
                gte(schema.lenaDena.dueDate, today),
                lte(schema.lenaDena.dueDate, threeDaysFromNow)
            ));

        return upcomingDues.map(iou => ({
            userId: iou.userId,
            title: iou.type === 'gave' ? '💸 Money to Collect' : '💰 Payment Due Soon',
            body: `${iou.type === 'gave' ? iou.name + ' owes you' : 'You owe ' + iou.name} ₹${iou.amount.toLocaleString()}\nDue: ${new Date(iou.dueDate).toLocaleDateString('en-IN')}`,
            icon: '/logo.png',
            data: { type: 'lena_dena_reminder', iouId: iou.id, dueDate: iou.dueDate },
            actions: [
                { action: 'view', title: 'View Details' },
                { action: 'settle', title: 'Mark Settled' }
            ]
        }));
    }

    // Helper: Generate savings tip
    private generateSavingsTip(budgetPercentage: number): string {
        if (budgetPercentage < 50) {
            return "Great job staying within budget! Keep it up! 🎉";
        } else if (budgetPercentage < 75) {
            return "You're on track to save well this month! 💪";
        } else if (budgetPercentage < 90) {
            return "Watch your spending - you're at 75% of budget 👀";
        } else {
            return "Consider cutting back on non-essentials to stay on budget ⚠️";
        }
    }

    // Helper: Generate family insight
    private generateFamilyInsight(sharedPercentage: number): string {
        if (sharedPercentage > 50) {
            return `Insight: ${sharedPercentage}% of spending is shared - good family coordination!`;
        } else if (sharedPercentage > 30) {
            return `Insight: Healthy mix of shared (${sharedPercentage}%) and personal expenses`;
        } else {
            return `Insight: Most expenses are personal (${100 - sharedPercentage}%) - consider shared budgets`;
        }
    }

    // Send notification to user (push or in-app)
    async sendNotification(userId: string, notification: NotificationContent): Promise<void> {
        // In production, this would send to FCM/APNs
        // For now, store in database for in-app retrieval
        console.log(`[NOTIFICATION] To ${userId}:`, notification.title);

        // TODO: Implement actual push notification sending
        // - Get user's push subscription from database
        // - Send via web-push library
        // - Handle errors and retries
    }
}

export const notificationService = new NotificationService();
