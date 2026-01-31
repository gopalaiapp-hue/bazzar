# 🎯 Quick Build Commands

## Development

```bash
npm run dev              # Start development server
npm run build:web        # Build web app
npx cap sync             # Sync web to Android
npm run cap:android      # Open in Android Studio
```

## Production Builds

```bash
# APK (for testing)
npm run android:build:release

# AAB (for Play Store)
npm run android:build:bundle
```

## Outputs

✅ **APK:** `android/app/build/outputs/apk/release/app-release.apk`  
✅ **AAB:** `android/app/build/outputs/bundle/release/app-release.aab`  
⚠️ **Mapping:** `android/app/build/outputs/mapping/release/mapping.txt`

## Obfuscation Status

- ✅ minifyEnabled: **true**
- ✅ shrinkResources: **true**  
- ✅ ProGuard: **enabled**
- ✅ Debug logs: **removed**

## Full Deploy

```bash
npm run build:web && \
npx cap sync && \
npm run android:build:bundle
```

See `BUILD_ANDROID_CAPACITOR.md` for full guide.
