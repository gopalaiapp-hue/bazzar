
import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

async function checkSupabaseVars() {
    console.log("🔍 Checking for Supabase variables...");

    const supDbUrl = process.env.SUPABASE_DB_URL;
    const dbUrl = process.env.DATABASE_URL;

    if (supDbUrl) {
        console.log("✅ Found SUPABASE_DB_URL variable.");
        if (supDbUrl === dbUrl) {
            console.log("ℹ️  SUPABASE_DB_URL is identical to DATABASE_URL.");
        } else {
            console.log("ℹ️  SUPABASE_DB_URL is DIFFERENT from DATABASE_URL. Testing connection...");
            try {
                const pool = new Pool({ connectionString: supDbUrl, connectionTimeoutMillis: 5000 });
                await pool.query("SELECT 1");
                console.log("✅ Connection to SUPABASE_DB_URL successful!");
                await pool.end();
                process.exit(0);
            } catch (e) {
                console.log("❌ Connection to SUPABASE_DB_URL failed: " + e.message);
            }
        }
    } else {
        console.log("❌ SUPABASE_DB_URL not found in environment.");
    }

    // Check if DATABASE_URL looks like Supabase
    if (dbUrl && dbUrl.includes("supabase")) {
        console.log("✅ DATABASE_URL appears to be Supabase.");
    } else if (dbUrl && dbUrl.includes("neon")) {
        console.log("⚠️  DATABASE_URL appears to be Neon.");
    }
}

checkSupabaseVars();
