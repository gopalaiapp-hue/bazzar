
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import "dotenv/config";

const { Pool } = pg;

async function checkConnection() {
    console.log("🔍 Checking database connection...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set.");
        process.exit(1);
    }

    // Mask the password for logging
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^@]+)@/, ":****@");
    console.log(`📡 Current DATABASE_URL: ${maskedUrl}`);

    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const db = drizzle(pool, { schema });

        console.log("📊 Running test query...");
        const start = Date.now();

        // Simple query to check connectivity
        const result = await db.select({
            count: schema.users.id
        }).from(schema.users).limit(1);

        const duration = Date.now() - start;
        console.log(`✅ Connection successful! Query took ${duration}ms`);
        console.log(`ℹ️  Found ${result.length} user record(s).`);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Connection failed:");
        console.error(error.message);
        process.exit(1);
    }
}

checkConnection();
