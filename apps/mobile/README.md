# Mobile App

## Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```
2. Run the app:
   ```bash
   yarn start
   ```

## Internationalization (i18n)

We use `i18next` and `react-i18next` for translations.

### Adding a new language
1. Open `src/services/i18n.ts`.
2. Add the language code and name to the `LANGUAGES` array.
3. Add the translations to the `resources` object.
4. Add the language code to the `LangCode` type.

### Usage
Use the `useTranslation` hook in your components:
```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  return <Text>{t('common.save')}</Text>;
}
```

### Testing
Run tests with:
```bash
yarn test
```

## QA Checklist
- [ ] Open Settings > Select Language.
- [ ] Select a different language (e.g., Hindi) and Save.
- [ ] Verify UI text changes immediately.
- [ ] Restart the app.
- [ ] Verify the selected language persists.
