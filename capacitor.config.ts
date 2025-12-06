import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.sahkosh.app',
    appName: 'SahKosh',
    webDir: 'dist/public',
    server: {
        androidScheme: 'https',
        // Point to your backend server for API calls
        url: 'https://hightech-lame-data--nitesh44.replit.app',
        cleartext: false
    },
    android: {
        buildOptions: {
            keystorePath: undefined,
            keystorePassword: undefined,
            keystoreAlias: undefined,
            keystoreAliasPassword: undefined,
            releaseType: 'APK'
        }
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#1E40AF',
            showSpinner: false
        }
    }
};

export default config;
