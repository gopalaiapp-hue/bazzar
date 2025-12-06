# ⚡ Quick Start - Cloud Build

## 3 Steps to Build APK/AAB (No Android Studio!)

### 1️⃣ Push to GitHub

```bash
git add .
git commit -m "Ready for cloud build"
git push
```

### 2️⃣ Wait for Build

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
2. Click on latest workflow
3. Wait ~5-10 minutes

### 3️⃣ Download APK/AAB

1. Scroll to **Artifacts** section
2. Download:
   - `app-release-xxxxx.zip` (APK inside)
   - `app-bundle-xxxxx.zip` (AAB inside)
   - `mapping-xxxxx.zip` (mapping.txt inside)

---

## 🎯 Manual Build (Without Push)

1. Go to GitHub → **Actions**
2. Click "Build Android APK/AAB"
3. Click **Run workflow** → **Run workflow**
4. Download from artifacts

---

## 📦 What You Get

- ✅ **Obfuscated APK** (ready to install)
- ✅ **Obfuscated AAB** (ready for Play Store)
- ✅ **mapping.txt** (for crash reports)

---

## 🚀 First Time Setup

```bash
# 1. Add GitHub remote (if not done)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 2. Push workflow file
git add .github/workflows/build-android.yml
git commit -m "Added cloud build workflow"
git push
```

---

See `CLOUD_BUILD_GUIDE.md` for full documentation.
