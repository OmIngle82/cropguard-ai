import { useStore } from '../store/useStore';
import { translations, type TranslationKey, type Locale } from './translations';

/**
 * useT — Lightweight i18n hook for CropGuard AI.
 *
 * Reads `user.language` from the Zustand store (reactive).
 * When the user changes language in Settings, all components
 * using useT() re-render automatically.
 *
 * Usage:
 *   const { t, lang } = useT();
 *   t('nav.home')  →  "मुख्यपृष्ठ" (mr) | "Home" (en)
 */
export function useT() {
    const language = useStore((s) => s.user?.language ?? 'en');
    const locale: Locale = (language === 'mr' ? 'mr' : 'en');

    function t(key: TranslationKey): string {
        const dict = translations[locale];
        // Fallback to English if key is missing in locale (safe for incremental rollout)
        return dict[key] ?? translations['en'][key] ?? key;
    }

    return { t, lang: locale };
}
