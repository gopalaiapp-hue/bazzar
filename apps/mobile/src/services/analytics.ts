type AnalyticsEvent = 'language_changed';

export const analytics = {
    track: (event: AnalyticsEvent, properties?: Record<string, any>) => {
        console.log(`[Analytics] ${event}`, properties);
    },
};
