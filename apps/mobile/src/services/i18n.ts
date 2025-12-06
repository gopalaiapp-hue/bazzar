import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from './analytics';

export type LangCode = 'en' | 'hi' | 'mr' | 'gu' | 'bn' | 'te' | 'kn' | 'ml' | 'ta';

export const LANGUAGES: { code: LangCode; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

const resources = {
    en: {
        translation: {
            settings: {
                select_language: 'Select Language',
                daily_brief: 'Daily Brief',
                notification_prefs: 'Notification Preferences',
            },
            common: {
                save: 'Save',
                cancel: 'Cancel',
            },
            onboarding: {
                family_question: 'What is your family type?',
            },
        },
    },
    hi: {
        translation: {
            settings: {
                select_language: 'भाषा चुनें',
                daily_brief: 'दैनिक संक्षिप्त',
                notification_prefs: 'सूचना प्राथमिकताएं',
            },
            common: {
                save: 'सहेजें',
                cancel: 'रद्द करें',
            },
            onboarding: {
                family_question: 'आपका परिवार किस प्रकार का है?',
            },
        },
    },
    mr: {
        translation: {
            settings: { select_language: 'भाषा निवडा' },
            common: { save: 'जतन करा', cancel: 'रद्द करा' },
        },
    },
    gu: {
        translation: {
            settings: { select_language: 'ભાષા પસંદ કરો' },
            common: { save: 'સાચવો', cancel: 'રદ કરો' },
        },
    },
    bn: {
        translation: {
            settings: { select_language: 'ভাষা নির্বাচন করুন' },
            common: { save: 'সংরক্ষণ করুন', cancel: 'বাতিল করুন' },
        },
    },
    te: {
        translation: {
            settings: { select_language: 'భాషను ఎంచుకోండి' },
            common: { save: 'సేవ్ చేయండి', cancel: 'రద్దు చేయండి' },
        },
    },
    kn: {
        translation: {
            settings: { select_language: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' },
            common: { save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದುಮಾಡಿ' },
        },
    },
    ml: {
        translation: {
            settings: { select_language: 'ഭാഷ തിരഞ്ഞെടുക്കുക' },
            common: { save: 'സരക്ഷിക്കുക', cancel: 'റദ്ദാക്കുക' },
        },
    },
    ta: {
        translation: {
            settings: { select_language: 'மொழியைத் தேர்ந்தெடுக்கவும்' },
            common: { save: 'சேமி', cancel: 'ரத்துசெய்' },
        },
    },
};

const LANGUAGE_STORAGE_KEY = 'settings:language';

const languageDetector = {
    type: 'languageDetector' as const,
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLanguage) {
                callback(savedLanguage);
                return;
            }
        } catch (error) {
            console.warn('Failed to load language from storage', error);
        }
        callback('en'); // Fallback
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        } catch (error) {
            console.warn('Failed to save language to storage', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

export const loadPersistedLanguage = async (): Promise<string> => {
    if (!i18n.isInitialized) {
        await i18n.init();
    }
    return i18n.language;
};

export const setPersistedLanguage = async (code: LangCode): Promise<void> => {
    const oldLang = i18n.language;
    try {
        if (oldLang !== code) {
            await i18n.changeLanguage(code);
            analytics.track('language_changed', { from: oldLang, to: code });
        }
    } catch (error) {
        console.error('Failed to set language', error);
        throw error;
    }
};

export default i18n;
