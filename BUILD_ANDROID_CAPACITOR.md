# 🚀 SahKosh Android Build Guide (Capacitor)

Build obfuscated APK and AAB files for Google Play Store release.

---

## ✅ What's Configured

| Feature | Status |
|---------|--------|
| **ProGuard Obfuscation** | ✅ Enabled (`minifyEnabled true`) |
| **Resource Shrinking** | ✅ Enabled (`shrinkResources true`) |
| **Signing Config** | ✅ Configured (using debug key, replace for production) |
| **Package Name** | `com.sahkosh.app` |
| **Version Code** | 1 |
| **Version Name** | 1.0 |

---

## 📋 Prerequisites

1. **Android Studio** installed (for editing/testing)
2. **JDK 17** or higher
3. **Node.js 18+**
4. **Gradle** (comes with Android Studio)

---

## 🔧 Quick Start

### Step 1: Install Dependencies (First Time Only)

```bash
npm install
```

### Step 2: Build Web App

```bash
npm run build:web
```

This compiles your React/Vite app to `dist/` folder.

### Step 3: Sync Web Assets to Android

```bash
npx cap sync
```

This copies web build to Android's `assets/` folder.

---

## 📦 Build APK/AAB

### Option A: Build from Command Line

#### Build Release APK (for testing)

```bash
npm run android:build:release
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

#### Build Release AAB (for Play Store)

```bash
npm run android:build:bundle
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

#### Build Mapping File Location

```
android/app/build/outputs/mapping/release/mapping.txt
```

**⚠️ IMPORTANT:** Save this file! You need it to deobfuscate crash reports.

---

### Option B: Build from Android Studio

1. Open Android project:
   ```bash
   npm run cap:android
   ```

2. In Android Studio:
   - **Build → Generate Signed Bundle/APK**
   - Select **Android App Bundle** (for Play Store) or **APK**
   - Choose **release** variant
   - Follow the wizard

---

## 🔑 Creating Production Keystore

The current config uses a debug keystore. For Play Store, create a production keystore:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore sahkosh-release.keystore -alias sahkosh -keyalg RSA -keysize 2048 -validity 10000
```

**Save these credentials securely:**
- Keystore password
- Key alias
- Key password

### Update build.gradle

Edit `android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file('sahkosh-release.keystore')
        storePassword 'YOUR_STORE_PASSWORD'
        keyAlias 'sahkosh'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}
```

**🔒 Security:** Never commit keystores or passwords to git!

---

## 📱 Install APK on Device

### Via USB (ADB)

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via File Transfer

1. Copy APK to phone
2. Enable "Install from unknown sources"
3. Tap APK to install

---

## 🎯 Upload to Play Store

### Step 1: Prepare Assets

- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (phones + tablets)
- [ ] Privacy policy URL
- [ ] App description

### Step 2: Upload AAB

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app or select existing
3. **Production → Create new release**
4. Upload `app-release.aab`
5. **Add release notes**
6. **Review and rollout**

### Step 3: Upload Obfuscation Mapping

- In Play Console → **App bundle explorer**
- **Upload deobfuscation file**
- Upload `mapping.txt`

This allows Google to show readable crash reports.

---

## 🐛 Troubleshooting

### ProGuard Breaks App

If app crashes after obfuscation, check logs:

```bash
adb logcat
```

Add keep rules to `proguard-rules.pro`:

```proguard
# Keep specific classes that crash
-keep class com.your.package.ClassName { *; }
```

### Build Fails

Clean and rebuild:

```bash
cd android
./gradlew clean
cd ..
npm run build:web
npx cap sync
npm run android:build:release
```

### WebView Not Loading

Check `capacitor.config.ts`:

```typescript
server: {
  androidScheme: 'https' // Must be https
}
```

### Version Code Already Used

Increment version in `android/app/build.gradle`:

```gradle
versionCode 2  // Increment each release
versionName "1.1"
```

---

## 📊 Verify Obfuscation

### Check APK Size

Obfuscated APK should be **smaller**:

```bash
# Before obfuscation: ~15-20 MB
# After obfuscation: ~8-12 MB (typical)
```

### Inspect APK

```bash
unzip -l app-release.apk | grep classes.dex
```

Class names should be obfuscated (a.class, b.class, etc.)

---

## 🔄 Full Release Workflow

```bash
# 1. Update version
# Edit android/app/build.gradle → versionCode, versionName

# 2. Build web app
npm run build:web

# 3. Sync to Android
npx cap sync

# 4. Build AAB for Play Store
npm run android:build:bundle

# 5. Test APK on device first
npm run android:build:release
adb install android/app/build/outputs/apk/release/app-release.apk

# 6. Save mapping file
cp android/app/build/outputs/mapping/release/mapping.txt ./mapping-v1.0.txt

# 7. Upload to Play Store
# Use AAB from: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Capacitor main config |
| `android/app/build.gradle` | Android build config with obfuscation |
| `android/app/proguard-rules.pro` | ProGuard obfuscation rules |
| `dist/` | Web build output |
| `android/app/src/main/assets/public/` | Synced web assets in Android |

---

## 🎉 Next Steps

1. **Test thoroughly** on multiple devices
2. **Alpha/Beta testing** via Play Store internal testing
3. **Monitor crash reports** with mapping.txt
4. **Update regularly** with bug fixes and features

---

## 🆘 Need Help?

- [Capacitor Docs](https://capacitorjs.com/docs/android)
- [ProGuard Manual](https://www.guardsquare.com/manual/home)
- [Play Console Help](https://support.google.com/googleplay/android-developer)

---

Good luck with your Play Store release! 🚀
