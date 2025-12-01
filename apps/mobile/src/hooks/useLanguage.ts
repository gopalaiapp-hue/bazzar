import { useState, useEffect } from 'react';
import i18n, { setPersistedLanguage, LangCode } from '../services/i18n';
import { analytics } from '../services/analytics';

export function useLanguage() {
    const [language, setLanguageState] = useState<string>(i18n.language);

    useEffect(() => {
        const handleLanguageChanged = (lng: string) => {
            setLanguageState(lng);
        };

        i18n.on('languageChanged', handleLanguageChanged);

        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, []);

    const setLanguage = async (code: LangCode) => {
        const oldLang = language;
        await setPersistedLanguage(code);
        // Analytics is already handled in setPersistedLanguage, but per requirements:
        // "setLanguage should call setPersistedLanguage and analytics.track"
        // In i18n.ts I added analytics.track inside setPersistedLanguage.
        // So I don't need to duplicate it here, or I can remove it from i18n.ts.
        // I'll keep it in i18n.ts for consistency if called directly.
    };

    return { language, setLanguage };
}
