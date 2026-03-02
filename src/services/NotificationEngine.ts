
import { useNotificationStore } from './NotificationService';
import { checkSchemeEligibility } from './SchemeService';

/**
 * Smart Notification Engine
 * Evaluates real-time rules (Weather, Schemes, Crop Health) 
 * and populates the notification center.
 */
export const runNotificationEngine = (profile: any, weather: any, forecast: any[]) => {
    const { addNotification, notifications } = useNotificationStore.getState();

    // 1. Weather Rules
    if (forecast && forecast.length > 0) {
        const rainChance = forecast[0]?.precipProb || 0;
        const tomorrowRain = forecast[1]?.precipProb || 0;

        // Severe Rain Alert (>70%)
        if (rainChance > 70 || tomorrowRain > 70) {
            const id = `rain-alert-${new Date().toDateString()}`;
            if (!notifications.some(n => n.id === id)) {
                addNotification({
                    id,
                    type: 'alert',
                    title: 'Heavy Rain Warning',
                    message: `Heavy rain expected (up to ${Math.max(rainChance, tomorrowRain)}%). Postpone any fertilizer or pesticide applications.`,
                });
            }
        }

        // Heat Stress Warning (>38°C)
        if (weather?.temp > 38) {
            const id = `heat-alert-${new Date().toDateString()}`;
            if (!notifications.some(n => n.id === id)) {
                addNotification({
                    id,
                    type: 'alert',
                    title: 'Heat Stress Alert',
                    message: `High temperature (${weather.temp}°C) detected. Ensure extra irrigation for young crops.`,
                });
            }
        }
    }

    // 2. Govt Scheme Rules (Eligibility Alignment)
    if (profile) {
        const eligibleSchemes = checkSchemeEligibility(profile);

        eligibleSchemes.forEach(scheme => {
            if (!scheme.isEligible) return; // 🛑 Only notify for actual matches

            const id = `scheme-${scheme.id}`;
            // addNotification now handles deduplication against active and dismissed notifications
            addNotification({
                id,
                type: 'success',
                title: `Eligible for ${scheme.title}`,
                message: `Based on your farm profile, you are eligible for ${scheme.title}. Check "Am I Eligible" to apply.`,
                actionUrl: scheme.url
            });
        });
    }

    // 3. System Clean-up (Removing legacy mock data if needed)
    // We could implement logic here to prune very old notifications
};
