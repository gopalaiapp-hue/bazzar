import { useEffect } from 'react';
import { useToast } from './use-toast';

let lastBackPress = 0;
const BACK_PRESS_INTERVAL = 2000; // 2 seconds

export function useBackButton(onBack?: () => void) {
    const { toast } = useToast();

    useEffect(() => {
        // Web browser back button handling
        const handlePopState = (event: PopStateEvent) => {
            event.preventDefault();
            const now = Date.now();

            // Web Vibration API (if supported)
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }

            if (lastBackPress && (now - lastBackPress) < BACK_PRESS_INTERVAL) {
                // Second press - allow navigation
                if (onBack) {
                    onBack();
                } else {
                    // Actually go back
                    lastBackPress = 0;
                    window.history.go(-2); // Go back 2 steps to override the pushState
                }
            } else {
                // First press - show warning and prevent navigation
                lastBackPress = now;
                toast({
                    title: "Press again to go back",
                    description: "Tap back again within 2 seconds",
                    duration: 2000
                });
                // Push state back to prevent navigation
                window.history.pushState(null, '', window.location.href);
            }
        };

        // Push initial state and add listener
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        // Cleanup
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [onBack, toast]);
}
