import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "./UserContext";
import { useToast } from "@/hooks/use-toast";

type NotificationPreferences = {
    spending: boolean;
    goals: boolean;
    family: boolean;
    budget: boolean;
};

type NotificationContextType = {
    preferences: NotificationPreferences;
    dailyBriefTime: string;
    setNotificationPreferences: (preferences: NotificationPreferences) => void;
    setDailyBriefTime: (time: string) => void;
    scheduleDailyBrief: () => void;
    cancelDailyBrief: () => void;
    showTestNotification: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        spending: true,
        goals: true,
        family: true,
        budget: true
    });
    const [dailyBriefTime, setDailyBriefTime] = useState("20:00");
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
    const [scheduledNotificationId, setScheduledNotificationId] = useState<number | null>(null);

    // Load notification settings from user preferences
    useEffect(() => {
        if (user?.settings?.notifications) {
            setPreferences(user.settings.notifications);
        }
        if (user?.settings?.dailyBriefTime) {
            setDailyBriefTime(user.settings.dailyBriefTime);
        }
    }, [user]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    setNotificationPermission(permission);
                });
            } else {
                setNotificationPermission(Notification.permission);
            }
        }
    }, []);

    const scheduleDailyBrief = () => {
        // Cancel any existing scheduled notification
        cancelDailyBrief();

        if (!dailyBriefTime || notificationPermission !== 'granted') {
            return;
        }

        // Parse the time
        const [hours, minutes] = dailyBriefTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            console.error('Invalid daily brief time format');
            return;
        }

        // Calculate time until next notification
        const now = new Date();
        const nextNotification = new Date();
        nextNotification.setHours(hours, minutes, 0, 0);

        // If the time has already passed today, schedule for tomorrow
        if (nextNotification <= now) {
            nextNotification.setDate(nextNotification.getDate() + 1);
        }

        const timeUntilNotification = nextNotification.getTime() - now.getTime();

        // Schedule the notification
        const timeoutId = window.setTimeout(() => {
            showDailyBriefNotification();
            // Schedule the next one for tomorrow
            scheduleDailyBrief();
        }, timeUntilNotification);

        setScheduledNotificationId(timeoutId);
        console.log(`Daily brief scheduled for ${nextNotification.toLocaleString()}`);
    };

    const cancelDailyBrief = () => {
        if (scheduledNotificationId) {
            window.clearTimeout(scheduledNotificationId);
            setScheduledNotificationId(null);
        }
    };

    const showDailyBriefNotification = () => {
        if (notificationPermission !== 'granted' || !('Notification' in window)) {
            // Fallback to toast notification if browser notifications aren't available
            toast({
                title: "Daily Financial Brief",
                description: "Here's your daily financial summary. Tap to view details.",
                duration: 10000,
            });
            return;
        }

        // Generate sample financial data for the notification
        const sampleData = {
            totalSpent: Math.floor(Math.random() * 5000) + 500,
            remainingBudget: Math.floor(Math.random() * 20000) + 10000,
            topCategories: ['Food', 'Transport', 'Entertainment'],
            savingsProgress: Math.min(90, Math.floor(Math.random() * 30) + 60)
        };

        const notification = new Notification('💰 Daily Financial Brief', {
            body: `Today: ₹${sampleData.totalSpent} spent | ₹${sampleData.remainingBudget} remaining`,
            icon: '/favicon.png',
            data: sampleData,
            requireInteraction: true
        });

        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            // In a real app, you might navigate to a specific page
            toast({
                title: "Daily Brief",
                description: `Today's spending: ₹${sampleData.totalSpent}\nRemaining budget: ₹${sampleData.remainingBudget}\nSavings progress: ${sampleData.savingsProgress}%`,
                duration: 8000,
            });
        };

        notification.onclose = () => {
            console.log('Notification was closed');
        };
    };

    const showTestNotification = () => {
        if (notificationPermission !== 'granted') {
            toast({
                title: "Notification Permission Required",
                description: "Please allow notifications to test this feature.",
                variant: "destructive"
            });
            return;
        }

        const testNotification = new Notification('🧪 Test Notification', {
            body: 'This is a test of the notification system.',
            icon: '/favicon.png',

        });

        testNotification.onclick = () => {
            toast({
                title: "Test Successful",
                description: "Notification system is working properly!",
            });
        };
    };

    // Schedule daily brief when preferences or time changes
    useEffect(() => {
        if (preferences.budget) { // Only schedule if budget notifications are enabled
            scheduleDailyBrief();
        } else {
            cancelDailyBrief();
        }

        return () => {
            cancelDailyBrief();
        };
    }, [preferences.budget, dailyBriefTime]);

    return (
        <NotificationContext.Provider
            value={{
                preferences,
                dailyBriefTime,
                setNotificationPreferences: setPreferences,
                setDailyBriefTime,
                scheduleDailyBrief,
                cancelDailyBrief,
                showTestNotification
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}