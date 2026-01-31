# 🚀 Neon to Supabase Migration Guide

Complete step-by-step guide for migrating from Neon Postgres to Supabase while preserving all data, auth users, and password hashes.

---

## 📋 Prerequisites

### Before You Begin

-  [ ] **Postgres Client Tools** installed (`pg_dump`, `pg_restore`, `psql`)
- [ ] **Neon Database Access** (connection string with read access)
- [ ] **Supabase Account** (free tier is fine for testing)
- [ ] **Maintenance Window Planned** (30-60 minutes for production)
- [ ] **Team Notified** (if applicable)
- [ ] **Backups Verified** (test restore before migration)

### Required Credentials

Store these as **environment variables** or **GitHub Secrets**:

```bash
# Neon (source)
export NEON_DB_URL="postgres://user:pass@ep-xxx.neon.tech:5432/dbname"

# Supabase (destination)
export SUPABASE_DB_URL="postgres://postgres.xxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGc..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

---

## 🎯 Migration Approach

| Approach | Best For | Downtime | Complexity |
|----------|----------|----------|------------|
| **Option A: Full Cutover** | Small-medium DB | 30-60 min | Low |
| **Option B: Staged Migration** | Large DB | Minimal | Medium |
| **Option C: GitHub Actions** | Automated/Repeatable | Varies | Low |

**Recommendation:** Start with **Option C (GitHub Actions)** on a staging environment to test the process.

---

## 🛠️ Option A: Manual Migration (Full Cutover)

Perfect for first-time migration or small databases.

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose region (same as or close to Neon for speed)
4. Set strong database password
5. Wait for project to finish provisioning (~2 minutes)
6. Copy project credentials:
   - Project URL
   - API Keys (anon + service_role)
   - Database connection string

### Step 2: Export Neon Database

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run export (creates timestamped backup)
./scripts/export-from-neon.sh
```

**What it does:**
- ✅ Exports full database (schema + data)
- ✅ Exports auth users with encrypted passwords
- ✅ Generates checksums
- ✅ Creates migration report

**Output location:** `./migration-backups/YYYYMMDD_HHMMSS/`

### Step 3: Review Backup

```bash
# Check the migration report
cat migration-backups/latest/MIGRATION_REPORT.txt

# Verify backup file sizes
ls -lh migration-backups/latest/
```

Look for:
- ✅ Non-zero file sizes
- ✅ Reasonable row counts
- ✅ Auth users exported (if applicable)

### Step 4: Test Import (Staging First!)

> [!WARNING]
> **Always test on a staging Supabase project first!**

Create a second Supabase project for staging, then:

```bash
# Point to staging Supabase
export SUPABASE_DB_URL="postgres://postgres.STAGING:pass@..."

# Run import
./scripts/import-to-supabase.sh
```

Type `yes` when prompted to confirm.

### Step 5: Verify Migration

```bash
# Compare Neon vs Supabase
./scripts/verify-migration.sh
```

**Expected output:**
- ✅ All table row counts match
- ✅ Auth user counts match
- ✅ Password hashes identical (users can login with existing passwords)
- ✅ Sample queries working

### Step 6: Test Application

1. **Update `.env` temporarily:**
   ```env
   # Comment out Neon
   # DATABASE_URL=postgres://...neon...
   
   # Add Supabase
   DATABASE_URL=postgres://...supabase...
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

2. **Restart server:**
   ```bash
   npm run dev
   ```

3. **Test critical flows:**
   - [ ] User signup
   - [ ] User login (with existing account)
   - [ ] Create/read/update/delete operations
   - [ ] Auth middleware working
   - [ ] RLS policies enforced

### Step 7: Production Cutover

When you're confident from staging tests:

1. **Announce maintenance window**
2. **Put app in read-only mode** (or down page)
3. **Stop accepting writes to Neon**
4. **Re-export Neon** (to capture any final changes)
5. **Import to production Supabase**
6. **Update production `.env`**
7. **Deploy backend**
8. **Update mobile APK** (rebuild with new URL in `capacitor.config.ts`)
9. **Monitor logs for errors**
10. **Keep Neon snapshot for 7 days** (rollback safety)

---

## ⚡ Option B: Staged Migration (Zero-Downtime)

For larger databases where downtime must be minimized.

### Pre-Migration

1. Set up logical replication from Neon to Supabase
2. Let replication catch up
3. Monitor lag

### Cutover

1. Put app in read-only briefly
2. Wait for final sync
3. Switch to Supabase
4. Resume writes

> [!NOTE]
> Logical replication setup is more complex. Contact Supabase support for guidance.

---

## 🤖 Option C: GitHub Actions (Recommended)

Automated, repeatable, with built-in rollback.

### Setup

1. **Add GitHub Secrets:**
   - Go to repo → Settings → Secrets → Actions
   - Add:
     - `NEON_DB_URL`
     - `SUPABASE_DB_URL`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

2. **Trigger Migration:**
   - Go to Actions tab
   - Select "Neon to Supabase Migration"
   - Click "Run workflow"
   - Choose environment: `staging` or `production`
   - Click "Run workflow"

3. **Monitor Progress:**
   - Watch workflow steps in real-time
   - Review migration report in summary

4. **Download Backups:**
   - Backups are uploaded as artifacts
   - Available for 90 days
   - Download for local storage

### Auto-Rollback

If migration fails, the workflow automatically reverts to the backup (staging only).

---

## 🔐 Auth User Migration Details

### How Password Hashes Are Preserved

1. Neon `auth.users` table contains bcrypt hashes in `encrypted_password`
2. Export includes this column
3. Import directly into Supabase `auth.users` with same column
4. Users login with existing passwords ✅

### If Using Custom User Table

If your users are NOT in `auth.users`:

```sql
-- Export from your custom user table
COPY (
    SELECT id, email, password_hash, created_at
    FROM your_users_table
) TO '/tmp/users.csv' WITH CSV HEADER;

-- Import to Supabase auth.users
-- (requires mapping your schema to Supabase auth schema)
```

Contact us if you need help with custom auth migration.

---

## ⚠️ Common Issues & Fixes

### Issue: Extensions Not Available

**Symptom:** `ERROR: extension "xyz" does not exist`

**Fix:**
1. Check Supabase supported extensions
2. Enable via Supabase dashboard → Database → Extensions
3. Re-run import

### Issue: RLS Policies Blocking Access

**Symptom:** Queries return empty or fail after migration

**Fix:**
1. Check auth context: `SELECT auth.uid();`
2. Verify JWT is passed correctly
3. Review RLS policies in Supabase dashboard
4. Update policies if `auth.uid()` usage changed

### Issue: Sequence Reset Needed

**Symptom:** `ERROR: duplicate key value violates unique constraint`

**Fix:**
```sql
-- Reset sequences manually
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('pockets_id_seq', (SELECT MAX(id) FROM pockets));
-- etc. for all tables with auto-increment IDs
```

### Issue: Large Database Import Timeout

**Fix:**
- Use `--jobs=4` flag for parallel restore
- Or use logical replication
- Or split dump into smaller files

---

## 📊 Migration Checklist

### Pre-Migration
- [ ] Supabase project created
- [ ] Credentials stored securely
- [ ] Backup tested and verified
- [ ] Staging migration successful
- [ ] Team notified of maintenance window

### During Migration
- [ ] Announce maintenance start
- [ ] Stop writes to Neon
- [ ] Export latest Neon data
- [ ] Import to Supabase
- [ ] Verify migration
- [ ] Update environment variables
- [ ] Deploy backend
- [ ] Update mobile config

### Post-Migration
- [ ] Test user login
- [ ] Test API endpoints
- [ ] Monitor error logs
- [ ] Check performance
- [ ] Verify RLS working
- [ ] Mobile APK updated
- [ ] Keep Neon backup for 7+ days

---

## 📞 Support

**Issues during migration?**
1. Check `MIGRATION_REPORT.txt` for errors
2. Review verification script output
3. See `ROLLBACK_PLAN.md` if you need to revert
4. Check Supabase docs: https://supabase.com/docs/guides/migrations

---

## 🎉 Success Criteria

Migration is successful when:
- ✅ All table row counts match
- ✅ Users can login with existing passwords
- ✅ All API endpoints respond correctly
- ✅ RLS policies working as expected
- ✅ No errors in application logs
- ✅ Performance is acceptable

**Congratulations! You're now running on Supabase! 🚀**
