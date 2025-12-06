# 🔙 Rollback Plan - Supabase to Neon

Emergency rollback procedures if you need to revert to Neon after migration.

---

## ⚠️ When to Rollback

Consider rollback if:
- ❌ **Critical data loss detected**
- ❌ **Auth system not working** (users can't login)
- ❌ **Performance severely degraded**
- ❌ **RLS policies blocking legitimate access**
- ❌ **Integration failures** (APIs, webhooks broken)
- ❌ **Migration verification failed**

---

## ⏱️ Rollback Windows

| Time Since Migration | Rollback Difficulty | Recommendation |
|---------------------|---------------------|----------------|
| < 1 hour | Easy | Safe to rollback |
| 1-24 hours | Medium | Review what changed |
| 24-72 hours | Hard | Consider fixing forward |
| > 72 hours | Very Hard | Fix issues on Supabase |

> [!CAUTION]
> After 72 hours, new data in Supabase will be lost during rollback. Consider fixing issues on Supabase instead.

---

## 🚨 Emergency Rollback (< 1 hour)


### If No New Data Written

If you caught the issue immediately and **no users have created new data**:

```bash
# 1. Put app in maintenance mode
# (Show maintenance page to users)

# 2. Restore Neon from backup
export NEON_DB_URL="postgres://ep-xxx.neon.tech:5432/dbname"
export BACKUP_DIR="./migration-backups/YYYYMMDD_HHMMSS"

pg_restore \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --dbname="$NEON_DB_URL" \
    "$BACKUP_DIR/neon_full_backup.dump"

# 3. Update .env back to Neon
# Uncomment Neon DATABASE_URL
# Comment out Supabase variables

# 4. Restart server
npm run dev

# 5. Test critical flows

# 6. Remove maintenance mode
```

### If New Data Was Written

If users created new data on Supabase, you need to **merge** it back:

```bash
# 1. Export new Supabase data
export SUPABASE_DB_URL="postgres://postgres.xxx..."

pg_dump \
    --data-only \
    --table=users \
    --table=pockets \
    --table=transactions \
    --dbname="$SUPABASE_DB_URL" \
    --file="supabase_new_data.sql"

# 2. Restore Neon backup (as above)

# 3. Import new data from Supabase
psql "$NEON_DB_URL" < supabase_new_data.sql

# 4. Resolve conflicts manually (if any)

# 5. Switch back to Neon
```

---

## 🔄 Partial Rollback (Keep Supabase, Fix Issues)

If the issue is specific (like RLS policy), fix it on Supabase:

### Fix RLS Policies

```sql
-- Disable RLS temporarily (DANGER - for debugging only!)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Or update policy
DROP POLICY IF EXISTS policy_name ON your_table;
CREATE POLICY policy_name ON your_table
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Fix Auth Issues

If users can't login but data is fine:

1. Check JWT configuration
2. Verify `auth.users` contains correct email/hash
3. Test with Supabase auth API directly
4. Check CORS settings

---

## 📋 Rollback Checklist

### Pre-Rollback
- [ ] Identify exact issue
- [ ] Assess impact (how many users affected)
- [ ] Determine if rollback necessary vs. fixing forward
- [ ] Notify team/stakeholders
- [ ] Download latest Supabase data (if resuming later)

### During Rollback
- [ ] Put app in maintenance mode
- [ ] Export any new Supabase data
- [ ] Restore Neon from backup
- [ ] Merge new data (if applicable)
- [ ] Update .env back to Neon
- [ ] Restart backend services
- [ ] Test critical flows

### Post-Rollback
- [ ] Announce service restored
- [ ] Monitor error rates
- [ ] Document what went wrong
- [ ] Plan fix before re-attempting migration
- [ ] Notify users (if they experienced issues)

---

## 🛠️ GitHub Actions Rollback

If you used GitHub Actions to migrate:

1. Go to **Actions** tab
2. Find the migration workflow run
3. Download the `neon-backup` artifact
4. Extract locally

5. Restore manually:
   ```bash
   pg_restore \
       --verbose \
       --clean \
       --no-owner \
       --no-acl \
       --dbname="$NEON_DB_URL" \
       ./neon_full_backup.dump
   ```

**Or trigger auto-rollback** (staging only):
- Re-run the failed workflow
- It will automatically restore from backup

---

## 🔍 Post-Rollback Analysis

After rolling back, figure out what went wrong:

### Data Issues
- Check migration verification logs
- Compare row counts
- Look for missing tables/columns
- Check for data type mismatches

### Auth Issues
- Verify password hash format
- Check `auth.users` schema matches
- Review identity providers configuration
- Test JWT generation

### Performance Issues
- Check Supabase project tier
- Review connection pooling settings
- Analyze slow query logs
- Consider database indexes

### RLS Issues
- Review policy definitions
- Test with different user roles
- Check `auth.uid()` resolution
- Verify JWT claims

---

## 🎯 Re-Migration Plan

After fixing the issues:

1. **Root cause identified** ✅
2. **Fix implemented in migration scripts** ✅
3. **Test on staging again** ✅
4. **Verify fix resolves original issue** ✅
5. **Schedule new migration window**
6. **Communicate to stakeholders**
7. **Execute migration with fixes**

---

## 📞 Emergency Contacts

**If rollback fails or you need help:**

1. **Supabase Support:**
   - Dashboard → Help → Contact Support
   - Discord: https://discord.supabase.com

2. **Neon Support:**
   - https://neon.tech/docs/introduction/support

3. **Database Expert:**
   - [Your DBA contact or consultant]

---

## 💾 Backup Storage Recommendations

**Keep these backups safe:**

- ✅ Original Neon export (90 days minimum)
- ✅ Supabase snapshots (if rolling back later)
- ✅ Migration logs and reports
- ✅ Environment variable backups

**Storage options:**
- S3/Cloud Storage
- Encrypted local archive
- GitHub Actions artifacts (90 days retention)
- External backup service

---

## ⏰ Rollback Time Estimates

| Scenario | Time Required | Complexity |
|----------|--------------|------------|
| Clean rollback (< 1hr) | 15-30 min | Low |
| With data merge | 1-2 hours | Medium |
| Complex conflicts | 2-4 hours | High |
| Emergency (overnight) | 4-8 hours | Very High |

---

## ✅ Rollback Success Criteria

Rollback is successful when:
- ✅ Neon database restored
- ✅ Users can login
- ✅ All critical features working
- ✅ New data preserved (if applicable)
- ✅ No error spikes in logs
- ✅ Performance normal

---

> [!NOTE]
> **Best Practice:** Test rollback procedure on staging before production migration to ensure you can successfully revert if needed.

**Remember:** Rollback is always an option, but fixing forward on Supabase is often better if the issue is minor! 🚀
