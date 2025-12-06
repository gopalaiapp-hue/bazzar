import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.sahkosh.app',
    appName: 'SahKosh',
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
