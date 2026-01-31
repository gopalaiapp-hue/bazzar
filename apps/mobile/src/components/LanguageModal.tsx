import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LangCode } from '../services/i18n';
import { useLanguage } from '../hooks/useLanguage';

interface LanguageModalProps {
    visible: boolean;
    onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ visible, onClose }) => {
    const { t } = useTranslation();
    const { language, setLanguage } = useLanguage();
    const [selectedLang, setSelectedLang] = React.useState<LangCode>(language as LangCode);

    React.useEffect(() => {
        if (visible) {
            setSelectedLang(language as LangCode);
        }
    }, [visible, language]);

    const handleSave = async () => {
        try {
            await setLanguage(selectedLang);
            // Wait for language change to complete before closing
            await new Promise(resolve => setTimeout(resolve, 100));
            onClose();
        } catch (error) {
            console.error('Failed to save language:', error);
        }
    };

    const renderItem = ({ item }: { item: typeof LANGUAGES[0] }) => {
        const isSelected = item.code === selectedLang;
        return (
            <TouchableOpacity
                style={[styles.languageItem, isSelected && styles.selectedItem]}
                onPress={() => setSelectedLang(item.code)}
            >
                <Text style={[styles.languageName, isSelected && styles.selectedText]}>
                    {item.nativeName} ({item.name})
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('settings.select_language')}</Text>
                    </View>

                    <FlatList
                        data={LANGUAGES}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.code}
                        style={styles.list}
                    />

                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    list: {
        padding: 8,
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 4,
    },
    selectedItem: {
        backgroundColor: '#f0f9ff',
    },
    languageName: {
        fontSize: 16,
        color: '#333',
    },
    selectedText: {
        color: '#007bff',
        fontWeight: '600',
    },
    checkmark: {
        color: '#007bff',
        fontSize: 18,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    saveButton: {
        backgroundColor: '#007bff',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});
