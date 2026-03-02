import * as Sentry from "@sentry/react";
import posthog from 'posthog-js';

export const initMonitoring = () => {
    if (import.meta.env.PROD) {
        // Sentry Init
        Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration(),
            ],
            tracesSampleRate: 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
        });

        // PostHog Init
        const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
        if (posthogKey) {
            posthog.init(posthogKey, {
                api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
                person_profiles: 'identified_only' // Don't track anonymous users too heavily
            });
        } else {
            console.warn("PostHog initialized without a token. Analytics will be disabled.");
        }
    } else {
        console.log("Monitoring initialized (Dev Request)");
    }
};

export const logError = (error: Error, context?: Record<string, any>) => {
    console.error("Logged Error:", error);
    if (import.meta.env.PROD) {
        Sentry.captureException(error, { extra: context });
    }
};

export const logEvent = (name: string, data?: Record<string, any>) => {
    console.log("Logged Event:", name, data);
    if (import.meta.env.PROD) {
        Sentry.captureMessage(name, {
            level: "info",
            extra: data
        });
        posthog.capture(name, data);
    }
};
