#!/bin/bash
set -e

# ============================================================================
# Neon to Supabase Migration - Export Script
# ============================================================================
# This script exports your Neon Postgres database including:
# - Full schema (tables, indexes, sequences, functions, triggers)
# - All data
# - Auth users with password hashes
# ============================================================================

echo "🚀 Starting Neon Database Export..."
echo "======================================"

# Check required environment variables
if [ -z "$NEON_DB_URL" ]; then
    echo "❌ Error: NEON_DB_URL not set"
    echo "Usage: export NEON_DB_URL='postgres://user:pass@host:5432/dbname'"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./migration-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 Backup directory: $BACKUP_DIR"

# Export full database (custom format - includes schema + data)
echo ""
echo "📦 Step 1/4: Exporting full database (custom format)..."
pg_dump \
    --format=custom \
    --no-owner \
    --no-acl \
    --verbose \
    --dbname="$NEON_DB_URL" \
    --file="$BACKUP_DIR/neon_full_backup.dump" 2>&1 | grep -v "^pg_dump:"

if [ $? -eq 0 ]; then
    echo "✅ Full backup created: neon_full_backup.dump"
    FILE_SIZE=$(du -h "$BACKUP_DIR/neon_full_backup.dump" | cut -f1)
    echo "   Size: $FILE_SIZE"
else
    echo "❌ Full backup failed"
    exit 1
fi

# Export schema only (plain SQL)
echo ""
echo "📋 Step 2/4: Exporting schema only (SQL format)..."
pg_dump \
    --schema-only \
    --no-owner \
    --no-acl \
    --dbname="$NEON_DB_URL" \
    --file="$BACKUP_DIR/neon_schema.sql"

if [ $? -eq 0 ]; then
    echo "✅ Schema exported: neon_schema.sql"
    LINE_COUNT=$(wc -l < "$BACKUP_DIR/neon_schema.sql")
    echo "   Lines: $LINE_COUNT"
else
    echo "❌ Schema export failed"
    exit 1
fi

# Export auth users (if auth.users table exists)
echo ""
echo "👥 Step 3/4: Exporting auth users..."
psql "$NEON_DB_URL" -c "\dt auth.users" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    # auth.users table exists, export it
    psql "$NEON_DB_URL" <<EOF > "$BACKUP_DIR/auth_users.csv"
COPY (
    SELECT 
        id, 
        aud, 
        role, 
        email, 
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    FROM auth.users
) TO STDOUT WITH CSV HEADER;
EOF
    
    if [ $? -eq 0 ]; then
        USER_COUNT=$(tail -n +2 "$BACKUP_DIR/auth_users.csv" | wc -l)
        echo "✅ Exported $USER_COUNT auth users with password hashes"
    else
        echo "⚠️  Warning: auth.users export failed"
    fi
else
    echo "ℹ️  No auth.users table found - skipping user export"
fi

# Generate migration report
echo ""
echo "📊 Step 4/4: Generating migration report..."
cat > "$BACKUP_DIR/MIGRATION_REPORT.txt" <<EOF
Neon to Supabase Migration Report
==================================
Generated: $(date)
Source DB: $NEON_DB_URL

Backup Files:
-------------
- neon_full_backup.dump  : Full database (custom format)
- neon_schema.sql        : Schema only (SQL)
- auth_users.csv         : Auth users with encrypted passwords

Statistics:
-----------
EOF

# Get table counts
echo "Table Row Counts:" >> "$BACKUP_DIR/MIGRATION_REPORT.txt"
psql "$NEON_DB_URL" -t -c "
    SELECT 
        schemaname || '.' || tablename AS table_name,
        n_live_tup AS row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
" >> "$BACKUP_DIR/MIGRATION_REPORT.txt"

# Create checksum
echo "" >> "$BACKUP_DIR/MIGRATION_REPORT.txt"
echo "Checksums:" >> "$BACKUP_DIR/MIGRATION_REPORT.txt"
md5sum "$BACKUP_DIR"/*.dump "$BACKUP_DIR"/*.sql "$BACKUP_DIR"/*.csv 2>/dev/null >> "$BACKUP_DIR/MIGRATION_REPORT.txt" || true

echo "✅ Migration report created"

# Final summary
echo ""
echo "======================================"
echo "✅ Export Complete!"
echo "======================================"
echo "Backup location: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "1. Review MIGRATION_REPORT.txt"
echo "2. Create Supabase project"
echo "3. Run import-to-supabase.sh"
echo ""
echo "⚠️  IMPORTANT: Keep these backups safe!"
echo "   They contain sensitive data and password hashes"
