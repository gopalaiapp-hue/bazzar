import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguageRow } from '../components/LanguageRow';

export const SettingsScreen: React.FC = () => {
    const { t } = useTranslation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>{t('settings.notification_prefs')}</Text>
                {/* Placeholder for notification settings */}
                <View style={styles.placeholderRow}>
                    <Text>{t('settings.daily_brief')}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>General</Text>
                <LanguageRow />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        paddingBottom: 8,
        fontSize: 13,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    placeholderRow: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
});
