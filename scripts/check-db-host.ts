
import "dotenv/config";

function checkHost() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.log("NO_URL");
        return;
    }

    if (url.includes("neon.tech")) {
        console.log("HOST: NEON");
    } else if (url.includes("supabase")) {
        console.log("HOST: SUPABASE");
    } else {
        console.log("HOST: OTHER (" + url.split('@')[1] + ")");
    }
}

checkHost();
