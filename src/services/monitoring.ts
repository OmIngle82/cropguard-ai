import * as Sentry from "@sentry/react";

export const initMonitoring = () => {
    if (import.meta.env.PROD) {
        // Sentry Init — Error tracking & session replay
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
    }
};
