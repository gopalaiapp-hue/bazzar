import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { loadPersistedLanguage } from './services/i18n';
import { SettingsScreen } from './screens/SettingsScreen';

export default function App() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                await loadPersistedLanguage();
            } catch (e) {
                console.warn('Failed to load language', e);
            } finally {
                setIsReady(true);
            }
        };
        init();
    }, []);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <SettingsScreen />
        </View>
    );
}
