#!/bin/bash
set -e

# ============================================================================
# Neon to Supabase Migration - Import Script
# ============================================================================
# This script imports your Neon backup into Supabase including:
# - Full schema restoration
# - All data
# - Auth users (preserving password hashes)
# - Sequence resets
# ============================================================================

echo "🚀 Starting Supabase Import..."
echo "======================================"

# Check required environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: SUPABASE_DB_URL not set"
    echo "Usage: export SUPABASE_DB_URL='postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'"
    exit 1
fi

if [ -z "$BACKUP_DIR" ]; then
    echo "⚠️  BACKUP_DIR not set, using latest backup..."
    BACKUP_DIR=$(ls -td migration-backups/*/ | head -1)
    echo "📁 Using: $BACKUP_DIR"
fi

# Verify backup files exist
if [ ! -f "$BACKUP_DIR/neon_full_backup.dump" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_DIR/neon_full_backup.dump"
    echo "Run export-from-neon.sh first!"
    exit 1
fi

echo "📁 Backup directory: $BACKUP_DIR"
echo ""

# Ask for confirmation
read -p "⚠️  This will OVERWRITE the Supabase database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Import cancelled"
    exit 0
fi

# Import full database
echo ""
echo "📦 Step 1/4: Importing database schema and data..."
echo "   This may take several minutes..."
pg_restore \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --dbname="$SUPABASE_DB_URL" \
    "$BACKUP_DIR/neon_full_backup.dump" 2>&1 | grep -E "(processing|creating|restoring)" || true

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Database restored successfully"
else
    echo "⚠️  Restore completed with warnings (this is often normal)"
fi

# Import auth users if CSV exists
echo ""
echo "👥 Step 2/4: Importing auth users..."
if [ -f "$BACKUP_DIR/auth_users.csv" ]; then
    USER_COUNT=$(tail -n +2 "$BACKUP_DIR/auth_users.csv" | wc -l)
    
    if [ $USER_COUNT -gt 0 ]; then
        echo "   Importing $USER_COUNT users with preserved password hashes..."
        
        # Import auth users
        psql "$SUPABASE_DB_URL" <<EOF
-- Import users (preserving password hashes)
COPY auth.users (
    id, aud, role, email, encrypted_password,
    email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
    phone_change, phone_change_token, phone_change_sent_at,
    email_change_token_current, email_change_confirm_status, banned_until,
    reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) FROM STDIN WITH CSV HEADER;
EOF
        cat "$BACKUP_DIR/auth_users.csv" | psql "$SUPABASE_DB_URL" -c "COPY auth.users FROM STDIN WITH CSV HEADER"
        
        if [ $? -eq 0 ]; then
            echo "✅ Imported $USER_COUNT auth users"
            echo "   ⚠️  Users can now login with their existing passwords"
        else
            echo "❌ Auth user import failed"
        fi
    else
        echo "ℹ️  No auth users to import"
    fi
else
    echo "ℹ️  No auth_users.csv found - skipping"
fi

# Reset sequences
echo ""
echo "🔄 Step 3/4: Resetting sequences..."
psql "$SUPABASE_DB_URL" <<EOF
DO \$\$
DECLARE
    seq RECORD;
BEGIN
    FOR seq IN 
        SELECT sequence_schema, sequence_name 
        FROM information_schema.sequences
        WHERE sequence_schema NOT IN ('pg_catalog', 'information_schema')
    LOOP
        EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(id) FROM %I.%I), 1))', 
            seq.sequence_schema || '.' || seq.sequence_name,
            REPLACE(seq.sequence_name, '_id_seq', ''),
            REPLACE(seq.sequence_name, '_id_seq', '')
        );
    END LOOP;
END\$\$;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Sequences reset"
else
    echo "⚠️  Some sequences may need manual reset"
fi

# Verification
echo ""
echo "✅ Step 4/4: Verification..."

# Count tables
TABLE_COUNT=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Tables: $TABLE_COUNT"

# Count auth users
AUTH_USER_COUNT=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null || echo "0")
echo "   Auth users: $AUTH_USER_COUNT"

# Sample row counts
echo ""
echo "   Sample table row counts:"
psql "$SUPABASE_DB_URL" -t -c "
    SELECT 
        '   - ' || tablename || ': ' || n_live_tup::text AS info
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC
    LIMIT 5;
"

# Final summary
echo ""
echo "======================================"
echo "✅ Import Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Run verify-migration.sh to validate data"
echo "2. Test user login with existing credentials"
echo "3. Test API endpoints"
echo "4. Update .env with Supabase credentials"
echo ""
echo "⚠️  Before going live:"
echo "   - Test all critical user flows"
echo "   - Verify RLS policies are working"
echo "   - Update mobile app config"
echo "   - Keep Neon backup for rollback!"
