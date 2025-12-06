import cron from "node-cron";
import { db } from "../../db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { notificationService } from "./notificationService";

class NotificationScheduler {
    private dailyBriefJob: any;
    private budgetCheckJob: any;
    private lenaDenaJob: any;

    // Start all scheduled jobs
    start() {
        console.log('[SCHEDULER] Starting notification scheduler...');

        // Daily Brief - Check every hour
        this.dailyBriefJob = cron.schedule('0 * * * *', async () => {
            await this.checkDailyBriefs();
        });

        // Budget Alerts - Check once per day at noon
        this.budgetCheckJob = cron.schedule('0 12 * * *', async () => {
            await this.checkBudgetAlerts();
        });

        // Lena-Dena Reminders - Check every 6 hours
        this.lenaDenaJob = cron.schedule('0 */6 * * *', async () => {
            await this.checkLenaDenaReminders();
        });

        console.log('[SCHEDULER] All jobs started successfully');
    }

    // Stop all jobs
    stop() {
        this.dailyBriefJob?.stop();
        this.budgetCheckJob?.stop();
        this.lenaDenaJob?.stop();
        console.log('[SCHEDULER] All jobs stopped');
    }

    // Check and send daily briefs
    private async checkDailyBriefs() {
        const currentHour = new Date().getHours();
        console.log(`[SCHEDULER] Checking daily briefs at hour ${currentHour}...`);

        try {
            // Get all active users
            const users = await db.select().from(schema.users);

            for (const user of users) {
                // Get user's configured daily brief time
                const briefTime = (user.settings as any)?.dailyBriefTime || '20:00';
                const [briefHour] = briefTime.split(':').map(Number);

                // Send brief if it's the user's configured hour
                if (currentHour === briefHour) {
                    try {
                        let notification;

                        if (user.familyType === 'joint' && user.role === 'admin') {
                            // Generate family brief for HoF
                            notification = await notificationService.generateFamilyBrief(user.id);
                        } else {
                            // Generate personal brief
                            notification = await notificationService.generatePersonalBrief(user.id);
                        }

                        await notificationService.sendNotification(user.id, notification);
                        console.log(`[SCHEDULER] Daily brief sent to ${user.name} (${user.id})`);
                    } catch (error) {
                        console.error(`[SCHEDULER] Error sending brief to ${user.id}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('[SCHEDULER] Error in checkDailyBriefs:', error);
        }
    }

    // Check and send budget alerts
    private async checkBudgetAlerts() {
        console.log('[SCHEDULER] Checking budget alerts...');

        try {
            const users = await db.select().from(schema.users);

            for (const user of users) {
                try {
                    const alerts = await notificationService.checkBudgetAlerts(user.id);

                    for (const alert of alerts) {
                        await notificationService.sendNotification(user.id, alert);
                        console.log(`[SCHEDULER] Budget alert sent to ${user.name} (${user.id})`);
                    }
                } catch (error) {
                    console.error(`[SCHEDULER] Error checking budget for ${user.id}:`, error);
                }
            }
        } catch (error) {
            console.error('[SCHEDULER] Error in checkBudgetAlerts:', error);
        }
    }

    // Check and send Lena-Dena reminders
    private async checkLenaDenaReminders() {
        console.log('[SCHEDULER] Checking Lena-Dena reminders...');

        try {
            const reminders = await notificationService.checkLenaDenaReminders();

            for (const reminder of reminders) {
                const { userId, ...notification } = reminder;
                await notificationService.sendNotification(userId, notification);
                console.log(`[SCHEDULER] Lena-Dena reminder sent to user ${userId}`);
            }
        } catch (error) {
            console.error('[SCHEDULER] Error in checkLenaDenaReminders:', error);
        }
    }

    // Manual trigger for testing
    async triggerDailyBrief(userId: string) {
        const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

        if (!user[0]) {
            throw new Error('User not found');
        }

        let notification;
        if (user[0].familyType === 'joint' && user[0].role === 'admin') {
            notification = await notificationService.generateFamilyBrief(userId);
        } else {
            notification = await notificationService.generatePersonalBrief(userId);
        }

        await notificationService.sendNotification(userId, notification);
        return notification;
    }

    async triggerBudgetAlerts(userId: string) {
        const alerts = await notificationService.checkBudgetAlerts(userId);
        for (const alert of alerts) {
            await notificationService.sendNotification(userId, alert);
        }
        return alerts;
    }
}

export const notificationScheduler = new NotificationScheduler();
