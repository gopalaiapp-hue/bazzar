// Notification service for transactions with haptic feedback and sounds
import { Capacitor } from '@capacitor/core';

// Lazy import Capacitor plugins (only load on native platforms)
let Haptics: any = null;
let LocalNotifications: any = null;

async function loadCapacitorPlugins() {
    if (Capacitor.isNativePlatform()) {
        try {
            const { Haptics: HapticsModule, ImpactStyle } = await import('@capacitor/haptics');
            const { LocalNotifications: LocalNotificationsModule } = await import('@capacitor/local-notifications');
            Haptics = { module: HapticsModule, ImpactStyle };
            LocalNotifications = LocalNotificationsModule;
        } catch (error) {
            console.warn('Capacitor plugins not available:', error);
        }
    }
}

// Initialize plugins on module load
loadCapacitorPlugins();

/**
 * Trigger vibration and notification when a transaction is added
 */
export async function notifyTransaction(
    type: 'income' | 'expense',
    amount: number,
    merchant: string
) {
    try {
        // Vibrate if on native platform
        if (Haptics?.module) {
            await Haptics.module.impact({ style: Haptics.ImpactStyle.Medium });
        } else {
            // Fallback to web vibration API
            if ('vibrate' in navigator) {
                navigator.vibrate(type === 'income' ? [100, 50, 100] : [200]);
            }
        }

        // Show notification if available
        if (LocalNotifications) {
            // Request permission first (silent if already granted)
            const permission = await LocalNotifications.checkPermissions();
            if (permission.display === 'granted' || permission.display === 'prompt') {
                await LocalNotifications.schedule({
                    notifications: [{
                        id: Date.now(),
                        title: type === 'income' ? '💰 Income Added' : '💸 Expense Recorded',
                        body: `₹${amount.toLocaleString()} ${type === 'income' ? 'received from' : 'spent at'} ${merchant}`,
                        sound: type === 'income' ? 'income' : 'expense',
                        smallIcon: 'ic_stat_icon',
                        iconColor: type === 'income' ? '#10b981' : '#ef4444',
                    }]
                });
            }
        } else {
            // Fallback to Web Notifications API
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(
                    type === 'income' ? '💰 Income Added' : '💸 Expense Recorded',
                    {
                        body: `₹${amount.toLocaleString()} ${type === 'income' ? 'received from' : 'spent at'} ${merchant}`,
                        icon: '/icon.png',
                        badge: '/badge.png',
                    }
                );
            }
        }
    } catch (error) {
        console.warn('Notification failed:', error);
    }
}

/**
 * Notify when a lent amount is due
 */
export async function notifyLentDue(name: string, amount: number, dueDate: Date) {
    try {
        // Heavy vibration for important reminder
        if (Haptics?.module) {
            await Haptics.module.impact({ style: Haptics.ImpactStyle.Heavy });
        } else {
            if ('vibrate' in navigator) {
                navigator.vibrate([300, 100, 300]);
            }
        }

        if (LocalNotifications) {
            await LocalNotifications.schedule({
                notifications: [{
                    id: Date.now(),
                    title: '⏰ Payment Due Reminder',
                    body: `${name} owes you ₹${amount.toLocaleString()}. Due: ${dueDate.toLocaleDateString()}`,
                    sound: 'lent_due',
                    smallIcon: 'ic_stat_icon',
                    iconColor: '#f59e0b',
                }]
            });
        } else {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ Payment Due Reminder', {
                    body: `${name} owes you ₹${amount.toLocaleString()}. Due: ${dueDate.toLocaleDateString()}`,
                    icon: '/icon.png',
                });
            }
        }
    } catch (error) {
        console.warn('Lent due notification failed:', error);
    }
}

/**
 * Request notification permissions (call on app start or user action)
 */
export async function requestNotificationPermission(): Promise<boolean> {
    try {
        if (LocalNotifications) {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } else if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    } catch (error) {
        console.warn('Permission request failed:', error);
        return false;
    }
}
