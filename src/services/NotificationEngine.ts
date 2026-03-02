
import { useNotificationStore } from './NotificationService';
import { checkSchemeEligibility } from './SchemeService';

/**
 * Smart Notification Engine
 * Uses fresh getState() calls per check to avoid stale snapshots.
 * Daily tip checks ONLY the active notifications list (not dismissedIds)
 * so it always re-appears after a clearAll() or login.
 */

/** Check if an id exists in active notifications OR was user-dismissed */
const isDismissed = (id: string) =>
    useNotificationStore.getState().dismissedIds.includes(id);

/** Check if an id already exists in active notifications */
const isActive = (id: string) =>
    useNotificationStore.getState().notifications.some(n => n.id === id);

const add = (n: { id: string; type: 'alert' | 'info' | 'success'; title: string; message: string; actionUrl?: string }) =>
    useNotificationStore.getState().addNotification(n);

export const runNotificationEngine = (profile: any, weather: any, forecast: any[]) => {
    const today = new Date().toDateString();

    // ── 1. Daily rotating tip — only skipped if already ACTIVE (not if dismissed)
    //    This ensures a fresh tip always appears after clearAll or login.
    const tips = [
        { title: 'Tip: Crop Rotation 🌾', message: 'Rotating crops each season prevents soil depletion and reduces pest buildup. Consider legumes after heavy feeders like cotton.' },
        { title: 'Tip: Composting 🌿', message: 'Organic compost improves soil structure and water retention. Even small quantities make a measurable difference over time.' },
        { title: 'Tip: Pest Management 🐛', message: 'Use neem-based sprays before chemical pesticides — safer, cheaper, and they don\'t harm beneficial insects like bees.' },
        { title: 'Tip: Drip Irrigation 💧', message: 'Drip irrigation can reduce water use by up to 50% compared to flood irrigation while improving crop yields.' },
        { title: 'Tip: Soil Testing 🧪', message: 'Test your soil every season. Soil health cards reveal nutrient deficiencies before they hurt your yield.' },
        { title: 'Tip: Morning Watering ☀️', message: 'Water early in the morning to minimize evaporation and let foliage dry before nightfall, reducing fungal disease risk.' },
        { title: 'Tip: Record Keeping 📋', message: 'Keep records of which varieties you planted, inputs applied, and yields. This data helps you improve year on year.' },
    ];
    const dayIndex = new Date().getDay();
    const tipId = `daily-tip-${today}`;
    // Only check isActive — NOT isDismissed — so tip always reappears after clearAll
    if (!isActive(tipId)) {
        add({ id: tipId, type: 'info', title: tips[dayIndex].title, message: tips[dayIndex].message });
    }

    // ── 2. Weather Rules (respect user dismissals) ────────────────────────────
    if (forecast && forecast.length > 0) {
        const rainChance = forecast[0]?.precipProb || 0;
        const tomorrowRain = forecast[1]?.precipProb || 0;
        const maxRain = Math.max(rainChance, tomorrowRain);

        if (maxRain > 70) {
            const id = `rain-alert-${today}`;
            if (!isActive(id) && !isDismissed(id)) {
                add({ id, type: 'alert', title: 'Heavy Rain Warning ☔', message: `Heavy rain expected (up to ${maxRain}%). Postpone fertilizer or pesticide applications.` });
            }
        } else if (maxRain > 30) {
            const id = `moderate-rain-${today}`;
            if (!isActive(id) && !isDismissed(id)) {
                add({ id, type: 'info', title: 'Moderate Rain Expected 🌦️', message: `${maxRain}% chance of rain in the next 24h. Consider light irrigation only.` });
            }
        }

        if (weather?.temp > 38) {
            const id = `heat-alert-${today}`;
            if (!isActive(id) && !isDismissed(id)) {
                add({ id, type: 'alert', title: 'Heat Stress Alert 🌡️', message: `Temperature is ${weather.temp}°C. Ensure extra irrigation for young crops.` });
            }
        } else if (weather?.temp > 30) {
            const id = `warm-day-${today}`;
            if (!isActive(id) && !isDismissed(id)) {
                add({ id, type: 'info', title: 'Warm Day — Monitor Crops 🌤️', message: `${weather?.temp}°C today. Water crops in the evening to reduce evaporation.` });
            }
        }

        if (weather && weather.wind <= 10 && (weather.precipProb || 0) <= 20) {
            const id = `spray-window-${today}`;
            if (!isActive(id) && !isDismissed(id)) {
                add({ id, type: 'success', title: 'Good Day for Spraying ✅', message: `Wind is calm (${weather.wind} km/h) and rain risk is low. Ideal for pesticide or fertilizer application.` });
            }
        }

        if (weather && (weather.soilMoisture || 50) < 25) {
            const id = `low-moisture-${today}`;
            if (!isActive(id) && !isDismissed(id)) {
                add({ id, type: 'alert', title: 'Low Soil Moisture ⚠️', message: `Soil moisture is critically low (${weather.soilMoisture}%). Irrigate your crops as soon as possible.` });
            }
        }
    }

    // ── 3. Govt Scheme Eligibility ────────────────────────────────────────────
    if (profile) {
        checkSchemeEligibility(profile).forEach(scheme => {
            if (!scheme.isEligible) return;
            const id = `scheme-${scheme.id}`;
            if (!isActive(id) && !isDismissed(id)) {
                add({
                    id, type: 'success',
                    title: `Eligible for ${scheme.title} 🎉`,
                    message: `Based on your profile, you qualify for ${scheme.title}. Check "Am I Eligible" to apply.`,
                    actionUrl: scheme.url
                });
            }
        });
    }
};
