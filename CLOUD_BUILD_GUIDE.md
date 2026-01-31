# ☁️ Cloud Build Guide - No Local Android SDK Required!

Build your Android APK/AAB automatically in the cloud using GitHub Actions.

---

## 🎯 How It Works

1. Push your code to GitHub
2. GitHub Actions automatically builds APK/AAB in the cloud
3. Download the obfuscated APK/AAB from GitHub
4. Upload to Play Store

**No Android Studio or SDK needed on your computer!**

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Git installed locally
- [x] Code pushed to GitHub repository

---

## 🚀 Setup (One-Time)

### Step 1: Push to GitHub

If not already done:

```bash
# Initialize git (if new project)
git init

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Add all files
git add .

# Commit
git commit -m "Added Capacitor Android build setup"

# Push to GitHub
git push -u origin main
```

### Step 2: Verify Workflow

1. Go to your GitHub repo
2. Click **Actions** tab
3. You should see "Build Android APK/AAB" workflow

---

## 🏗️ Building APK/AAB

### Method 1: Automatic Build on Push

Every time you push to `main` branch, GitHub automatically builds an APK:

```bash
git add .
git commit -m "Updated app"
git push
```

Then:
1. Go to GitHub → **Actions**
2. Click on the latest workflow run
3. Wait for build to complete (~5-10 mins)
4. Download artifacts from the workflow

### Method 2: Manual Trigger

Build on-demand without pushing code:

1. Go to GitHub → **Actions**
2. Click "Build Android APK/AAB" workflow
3. Click **Run workflow** button
4. Select build type:
   - **apk** - For testing
   - **aab** - For Play Store
   - **both** - Build both
5. Click **Run workflow**

### Method 3: Release Build (with Tag)

Create a GitHub release with attached APK/AAB:

```bash
# Tag your version
git tag v1.0.0

# Push tag
git push origin v1.0.0
```

This creates a **GitHub Release** with:
- ✅ APK file
- ✅ AAB file  
- ✅ mapping.txt file

---

## 📥 Downloading Built Files

### From Workflow Artifacts

1. Go to **Actions** → Click on workflow run
2. Scroll to **Artifacts** section
3. Download:
   - `app-release-xxxxx` (APK)
   - `app-bundle-xxxxx` (AAB)
   - `mapping-xxxxx` (ProGuard mapping)

### From GitHub Releases (if tagged)

1. Go to **Releases** section
2. Find your version (e.g., v1.0.0)
3. Download files under **Assets**

---

## 📱 Install APK on Phone

### Method 1: Direct Download on Phone

1. Copy the GitHub artifact download link
2. Open on Android phone
3. Download APK
4. Install (enable "Unknown sources" if needed)

### Method 2: Transfer via USB

```bash
# Download APK from GitHub to your computer
# Connect phone via USB
adb install path/to/app-release.apk
```

### Method 3: Upload to Play Store (Internal Testing)

1. Download AAB from GitHub
2. Go to [Play Console](https://play.google.com/console)
3. Internal Testing → Create Release
4. Upload AAB
5. Share test link with testers

---

## 🔄 Full Release Workflow

### For Testing (APK)

```bash
# 1. Make changes to code
# 2. Commit and push
git add .
git commit -m "Feature: Added new feature"
git push

# 3. Go to GitHub Actions
# 4. Download APK artifact
# 5. Install on test devices
```

### For Play Store (AAB)

```bash
# 1. Update version in android/app/build.gradle
# Edit: versionCode 2, versionName "1.1"

# 2. Commit version bump
git add android/app/build.gradle
git commit -m "Version 1.1"

# 3. Create release tag
git tag v1.1.0
git push origin v1.1.0

# 4. GitHub automatically builds and creates release
# 5. Download AAB from GitHub Release
# 6. Upload to Play Console
```

---

## ⚙️ Customizing the Build

### Change Build Type (APK vs AAB)

Edit `.github/workflows/build-android.yml`:

```yaml
# For APK only by default
- name: Build Release APK
  run: cd android && ./gradlew assembleRelease

# For AAB only by default
- name: Build Release AAB
  run: cd android && ./gradlew bundleRelease
```

### Build on Specific Branches

Edit workflow trigger:

```yaml
on:
  push:
    branches: [ main, production, release/* ]
```

### Add Signing (for Production)

1. Generate keystore locally
2. Encode to base64:
   ```bash
   base64 sahkosh-release.keystore > keystore.b64
   ```
3. Add GitHub Secrets:
   - `KEYSTORE_FILE` (base64 content)
   - `KEYSTORE_PASSWORD`
   - `KEY_ALIAS`
   - `KEY_PASSWORD`

4. Update workflow to decode and use keystore

---

## 🐛 Troubleshooting

### Build Failed

1. Check **Actions** → Failed workflow
2. Click on failed step
3. Read error logs
4. Common issues:
   - Missing dependencies → Run `npm ci`
   - Gradle build error → Check ProGuard rules
   - Capacitor sync error → Check `capacitor.config.ts`

### APK Not Working

1. Download `mapping.txt` from artifacts
2. Check crash logs with ProGuard mapping
3. Add keep rules to `proguard-rules.pro` if needed

### Workflow Not Triggering

1. Check `.github/workflows/` folder exists
2. Verify file is `build-android.yml` (not .yaml)
3. Check branch name matches trigger (main vs master)

---

## 📊 Build Status Badge

Add to your README.md:

```markdown
![Android Build](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/build-android.yml/badge.svg)
```

---

## 💰 Cost

**FREE** ✅

- GitHub Actions: 2000 minutes/month (free tier)
- Each build: ~5-10 minutes
- **~200-400 builds per month for free**

---

## 🎉 Benefits

| Feature | Cloud Build | Local Build |
|---------|------------|-------------|
| **Android SDK needed** | ❌ No | ✅ Yes (30+ GB) |
| **Build time** | ~5-10 mins | ~2-5 mins |
| **Storage required** | 0 GB | 30+ GB |
| **Setup complexity** | Easy | Complex |
| **Cost** | Free | Free |
| **Automation** | ✅ Automatic | ❌ Manual |

---

## 📖 Next Steps

1. ✅ Push code to GitHub
2. ✅ Verify workflow runs
3. ✅ Download APK/AAB
4. ✅ Test on device
5. ✅ Upload to Play Store

---

## 🆘 Need Help?

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Capacitor Docs](https://capacitorjs.com)
- Check workflow logs in Actions tab

---

Happy building in the cloud! ☁️🚀
