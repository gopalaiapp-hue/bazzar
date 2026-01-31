# 🤖 GitHub Actions Migration - Quick Start

Complete connection strings ready for GitHub Secrets:

---

## 🔐 Step 1: Add GitHub Secrets

Go to: https://github.com/gopalaiapp-hue/bazzar/settings/secrets/actions

Click **"New repository secret"** for each:

### Secret 1: NEON_DB_URL
```
postgresql://neondb_owner:npg_VZuzS3lD0AaQ@ep-aged-waterfall-ahlp08gl-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Secret 2: SUPABASE_DB_URL
```
postgresql://postgres.mtdngnyatbiipyumqmdd:U.7Rxmth.+w#!#F@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

---

## 🚀 Step 2: Run Migration Workflow

1. Go to: https://github.com/gopalaiapp-hue/bazzar/actions
2. Click **"Neon to Supabase Migration (Staging)"** in left sidebar
3. Click **"Run workflow"** button (right side)
4. Select:
   - **Environment:** `staging`
   - **Skip backup:** `false`
5. Click **"Run workflow"** (green button)

---

## ⏱️ Step 3: Monitor Progress

- Watch the workflow run (takes ~5-10 minutes)
- Steps you'll see:
  1. ✅ Checkout code
  2. ✅ Install PostgreSQL client
  3. ✅ Export Neon Database
  4. ✅ Upload Neon Backup
  5. ✅ Import to Supabase
  6. ✅ Verify Migration
  7. ✅ Generate Report

---

## 📥 Step 4: Download Backups (After Success)

1. Scroll to **"Artifacts"** section
2. Download:
   - `neon-backup-xxxxx.zip` (full backup for rollback)

---

## ✅ Step 5: Verify Migration

Once workflow completes:

1. Check the summary for verification results
2. Look for:
   - ✅ All table row counts match
   - ✅ Auth users migrated
   - ✅ Password hashes preserved

---

## 🎯 What Happens Next?

If migration succeeds:
- ✅ Your data is in Supabase
- ✅ Auth users preserved
- ✅ Backups saved

Then I'll help you:
1. Update `.env` to use Supabase
2. Test the application
3. Deploy backend
4. Rebuild mobile APK

---

**Ready to start? Add those 2 secrets and run the workflow!** 🚀
