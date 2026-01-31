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
        if (oldLang !== code) {
            await setPersistedLanguage(code);
        }
    };

    return { language, setLanguage };
}
