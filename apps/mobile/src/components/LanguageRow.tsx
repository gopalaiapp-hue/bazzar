import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguageModal } from './LanguageModal';
import { useLanguage } from '../hooks/useLanguage';
import { LANGUAGES, LangCode } from '../services/i18n';

export const LanguageRow: React.FC = () => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [modalVisible, setModalVisible] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(language);

    // Update current language when the global language changes
    React.useEffect(() => {
        setCurrentLanguage(language);
    }, [language]);

    const currentLangName = LANGUAGES.find(l => l.code === currentLanguage)?.name || 'English';

    return (
        <>
            <TouchableOpacity style={styles.row} onPress={() => setModalVisible(true)}>
                <View style={styles.left}>
                    <Text style={styles.label}>{t('settings.select_language')}</Text>
                </View>
                <View style={styles.right}>
                    <Text style={styles.value}>{currentLangName}</Text>
                    <Text style={styles.arrow}>›</Text>
                </View>
            </TouchableOpacity>
            <LanguageModal visible={modalVisible} onClose={() => setModalVisible(false)} />
        </>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    left: {
        flex: 1,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: '#333',
    },
    value: {
        fontSize: 16,
        color: '#888',
        marginRight: 8,
    },
    arrow: {
        fontSize: 20,
        color: '#ccc',
    },
});
