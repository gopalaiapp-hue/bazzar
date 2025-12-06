# SahKosh Android Build Guide
## Obfuscated APK/AAB for Play Store

---

## Prerequisites

1. **Node.js** (v18+) installed
2. **Expo CLI** installed globally: `npm install -g expo-cli`
3. **EAS CLI** installed globally: `npm install -g eas-cli`
4. **Expo Account** - Create at https://expo.dev
5. **Keystore** - For signing release builds

---

## Step 1: Install Dependencies

```bash
cd apps/mobile
npm install
```

---

## Step 2: Login to Expo

```bash
npx eas login
```

---

## Step 3: Configure EAS Project

```bash
npx eas build:configure
```

This links your project to Expo's build service.

---

## Step 4: Create Keystore (First Time Only)

EAS will generate a keystore for you automatically on first build.
Or create manually:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore sahkosh-release.keystore -alias sahkosh -keyalg RSA -keysize 2048 -validity 10000
```

---

## Step 5: Build Obfuscated APK (For Testing)

```bash
npm run build:android:apk
```

This builds a **production APK** with:
- ✅ R8/ProGuard obfuscation enabled
- ✅ Shrink resources enabled
- ✅ Release signing

---

## Step 6: Build Obfuscated AAB (For Play Store)

```bash
npm run build:android:aab
```

This builds an **Android App Bundle** required for Play Store.

---

## Step 7: Download Build Artifacts

After build completes on EAS:
1. Go to https://expo.dev → Your Project → Builds
2. Download:
   - `app-release.aab` (for Play Store)
   - `app-release.apk` (for testing)
   - `mapping.txt` (for crash deobfuscation)

---

## Local Build (Advanced)

If you prefer local builds:

### Generate Native Android Project
```bash
npm run prebuild
```

### Build Locally
```bash
# For APK
npm run build:local:apk

# For AAB
npm run build:local:aab
```

### Output Locations
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- Mapping: `android/app/build/outputs/mapping/release/mapping.txt`

---

## Obfuscation Details

The following obfuscation is enabled:

| Feature | Status |
|---------|--------|
| **minifyEnabled** | ✅ Enabled |
| **shrinkResources** | ✅ Enabled |
| **R8 Optimization** | ✅ Enabled |
| **Debug Log Removal** | ✅ Enabled |
| **Class Name Obfuscation** | ✅ Enabled |

Custom rules in `proguard-rules.pro`:
- Keeps React Native bridge classes
- Keeps Expo modules
- Keeps AsyncStorage
- Removes debug logs
- Preserves crash report line numbers

---

## Play Store Checklist

Before uploading to Play Console:

- [ ] Version code incremented in `app.json`
- [ ] Version name updated (e.g., "1.0.1")
- [ ] Package name matches Play Console (`com.sahkosh.app`)
- [ ] Signed with upload keystore
- [ ] Target SDK is latest (API 34+)
- [ ] Privacy policy URL added
- [ ] App icons are correct (512x512)
- [ ] Screenshots prepared
- [ ] `mapping.txt` saved for crash deobfuscation

---

## Upload to Play Store

1. Go to [Play Console](https://play.google.com/console)
2. Create/Select your app
3. Go to **Production** → **Create new release**
4. Upload `app-release.aab`
5. Add release notes
6. Submit for review

---

## Troubleshooting

### ProGuard Errors
If app crashes after obfuscation, add keep rules to `proguard-rules.pro`:
```
-keep class com.yourpackage.** { *; }
```

### Build Fails
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run prebuild
```

### EAS Build Queue
Free tier has limited concurrent builds. Upgrade for faster builds.

---

## Files Created

| File | Purpose |
|------|---------|
| `app.json` | Expo configuration with Android settings |
| `eas.json` | EAS Build profiles |
| `proguard-rules.pro` | Custom obfuscation rules |
| `assets/` | App icons folder (add your icons here) |

---

## Required Assets

Add these to `assets/` folder:
- `icon.png` (1024x1024) - App icon
- `adaptive-icon.png` (1024x1024) - Android adaptive icon
- `splash.png` (1284x2778) - Splash screen
- `favicon.png` (48x48) - Web favicon

---

Good luck with your Play Store release! 🚀
