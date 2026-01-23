import fs from 'fs';
import path from 'path';

// CONFIGURATION
const PACKAGE_NAME = "com.sahkosh.app"; // Verified from build.gradle
const AAB_PATH = "./android/app/build/outputs/bundle/release/app-release.aab";
const INDUS_API_URL = `https://api.indusappstore.com/devtools/apk/upgrade/${PACKAGE_NAME}`;

// Get Token from arguments
const token = process.argv[2];

if (!token) {
    console.error("❌ Error: Please provide your API Token.");
    console.log("Usage: node upload-indus.mjs <YOUR_O_BEARER_TOKEN>");
    console.log("Example: node upload-indus.mjs eyJhbGciOi...");
    process.exit(1);
}

async function upload() {
    console.log(`🚀 Starting upload for ${PACKAGE_NAME}...`);
    console.log(`📂 File: ${AAB_PATH}`);

    if (!fs.existsSync(AAB_PATH)) {
        console.error("❌ Error: AAB file not found at " + AAB_PATH);
        process.exit(1);
    }

    const fileDetail = fs.statSync(AAB_PATH);
    console.log(`📦 Size: ${(fileDetail.size / (1024 * 1024)).toFixed(2)} MB`);

    const formData = new FormData();
    const fileBuffer = fs.readFileSync(AAB_PATH);
    const fileBlob = new Blob([fileBuffer], { type: 'application/octet-stream' });

    formData.append('file', fileBlob, 'app-release.aab');

    try {
        const response = await fetch(INDUS_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `O-Bearer ${token}`,
                // Note: fetch automatically sets Content-Type for FormData
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            console.log("✅ Upload Successful!");
            console.log("Response:", JSON.stringify(result, null, 2));
        } else {
            console.error("❌ Upload Failed!");
            console.error(`Status: ${response.status} ${response.statusText}`);
            console.error("Error:", JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error("❌ Network or Script Error:", error);
    }
}

upload();
