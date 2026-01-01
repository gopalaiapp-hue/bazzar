import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.bazaarbudget.app',
    appName: 'BazaarBudget',
    webDir: 'dist/public',
    server: {
        androidScheme: 'https'
    },
    android: {
        buildOptions: {
            keystorePath: undefined,
            keystorePassword: undefined,
            keystoreAlias: undefined,
            keystoreAliasPassword: undefined,
            releaseType: 'APK'
        }
    }
};

export default config;
