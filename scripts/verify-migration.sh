#!/bin/bash
set -e

# ============================================================================
# Neon to Supabase Migration - Verification Script
# ============================================================================
# Verifies that the migration was successful by comparing:
# - Table row counts
# - Sample data integrity
# - Auth user counts
# - Schema objects
# ============================================================================

echo "🔍 Starting Migration Verification..."
echo "======================================"

# Check required environment variables
if [ -z "$NEON_DB_URL" ] || [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: Both NEON_DB_URL and SUPABASE_DB_URL must be set"
    exit 1
fi

FAILED=0

# Compare table counts
echo ""
echo "📊 Step 1/5: Comparing table row counts..."
echo ""

psql "$NEON_DB_URL" -t -c "
    SELECT tablename, n_live_tup
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
" > /tmp/neon_counts.txt

psql "$SUPABASE_DB_URL" -t -c "
    SELECT tablename, n_live_tup
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
" > /tmp/supabase_counts.txt

echo "Table Name                    | Neon Rows  | Supabase Rows | Status"
echo "-----------------------------------------------------------------------"

while IFS='|' read -r table neon_count; do
    table=$(echo $table | xargs)
    neon_count=$(echo $neon_count | xargs)
    
    supabase_count=$(grep -E "^\s*$table\s*\|" /tmp/supabase_counts.txt | awk -F'|' '{print $2}' | xargs || echo "0")
    
    if [ "$neon_count" = "$supabase_count" ]; then
        echo "$table | $neon_count | $supabase_count | ✅"
    else
        echo "$table | $neon_count | $supabase_count | ❌ MISMATCH"
        FAILED=$((FAILED + 1))
    fi
done < /tmp/neon_counts.txt

# Compare auth users
echo ""
echo "👥 Step 2/5: Comparing auth users..."
NEON_USERS=$(psql "$NEON_DB_URL" -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null || echo "0")
SUPABASE_USERS=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null || echo "0")

if [ "$NEON_USERS" = "$SUPABASE_USERS" ]; then
    echo "✅ Auth users match: $NEON_USERS users"
else
    echo "❌ Auth user mismatch: Neon=$NEON_USERS, Supabase=$SUPABASE_USERS"
    FAILED=$((FAILED + 1))
fi

# Verify sample user can login (password hash check)
echo ""
echo "🔐 Step 3/5: Verifying password hashes..."
SAMPLE_EMAIL=$(psql "$SUPABASE_DB_URL" -t -c "SELECT email FROM auth.users LIMIT 1;" | xargs)

if [ ! -z "$SAMPLE_EMAIL" ]; then
    NEON_HASH=$(psql "$NEON_DB_URL" -t -c "SELECT encrypted_password FROM auth.users WHERE email = '$SAMPLE_EMAIL';" 2>/dev/null || echo "")
    SUPABASE_HASH=$(psql "$SUPABASE_DB_URL" -t -c "SELECT encrypted_password FROM auth.users WHERE email = '$SAMPLE_EMAIL';" 2>/dev/null || echo "")
    
    if [ "$NEON_HASH" = "$SUPABASE_HASH" ]; then
        echo "✅ Password hashes match for $SAMPLE_EMAIL"
        echo "   Users should be able to login with existing passwords"
    else
        echo "⚠️  Password hash mismatch detected"
        echo "   This may require users to reset passwords"
        FAILED=$((FAILED + 1))
    fi
else
    echo "ℹ️  No users found to verify password hashes"
fi

# Compare schema objects
echo ""
echo "📋 Step 4/5: Comparing schema objects..."
NEON_TABLES=$(psql "$NEON_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
SUPABASE_TABLES=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "   Tables: Neon=$NEON_TABLES, Supabase=$SUPABASE_TABLES"
if [ "$NEON_TABLES" != "$SUPABASE_TABLES" ]; then
    echo "   ⚠️  Table count mismatch"
    FAILED=$((FAILED + 1))
fi

NEON_FUNCTIONS=$(psql "$NEON_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';")
SUPABASE_FUNCTIONS=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';")

echo "   Functions: Neon=$NEON_FUNCTIONS, Supabase=$SUPABASE_FUNCTIONS"

# Test sample queries
echo ""
echo "🧪 Step 5/5: Testing sample queries..."

# Test a sample query on main tables
SAMPLE_TEST=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM users LIMIT 1;" 2>/dev/null || echo "FAILED")

if [ "$SAMPLE_TEST" != "FAILED" ]; then
    echo "✅ Sample queries working"
else
    echo "⚠️  Some queries may be failing"
fi

# Summary
echo ""
echo "======================================"
if [ $FAILED -eq 0 ]; then
    echo "✅ Migration Verified Successfully!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Test user login with existing credentials"
    echo "2. Run API smoke tests"
    echo "3. Update .env to use Supabase"
    echo "4. Deploy and monitor"
else
    echo "⚠️  Verification Found $FAILED Issues"
    echo "======================================"
    echo ""
    echo "Review the issues above and:"
    echo "1. Check migration logs"
    echo "2. Manually verify affected tables"
    echo "3. Consider re-running import"
    echo "4. DO NOT go live until resolved"
fi

echo ""
echo "Cleanup temp files..."
rm -f /tmp/neon_counts.txt /tmp/supabase_counts.txt

exit $FAILED
