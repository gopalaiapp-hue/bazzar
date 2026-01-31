import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LanguageModal } from '../src/components/LanguageModal';
import { LanguageRow } from '../src/components/LanguageRow';
import i18n from '../src/services/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

describe('Language Selector Integration', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('en');
        jest.clearAllMocks();
    });

    it('should display current language', () => {
        const { getByText } = render(<LanguageRow />);
        expect(getByText('English')).toBeTruthy();
    });

    it('should change language and persist it', async () => {
        const { getByText, getByTestId } = render(<LanguageRow />);

        // Open modal
        fireEvent.press(getByText('Select Language'));

        // Check if modal is visible (by finding Hindi option)
        const hindiOption = getByText('हिंदी (Hindi)');
        expect(hindiOption).toBeTruthy();

        // Select Hindi
        fireEvent.press(hindiOption);

        // Press Save
        fireEvent.press(getByText('Save'));

        // Wait for language change
        await waitFor(() => {
            expect(i18n.language).toBe('hi');
        });

        // Verify persistence
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('settings:language', 'hi');

        // Verify UI update (LanguageRow should now show Hindi)
        // Note: The row shows the name in English ('Hindi') based on my implementation
        expect(getByText('Hindi')).toBeTruthy();
    });
});
