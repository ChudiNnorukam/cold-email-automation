import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

try {
    if (!fs.existsSync(envPath)) {
        console.log("❌ .env file NOT found at:", envPath);
    } else {
        console.log("✅ .env file found at:", envPath);
        const content = fs.readFileSync(envPath, 'utf-8');
        console.log("--- Keys Found ---");
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=');
                if (parts.length > 0) {
                    console.log(`Key: ${parts[0].trim()}`);
                }
            }
        });
        console.log("------------------");
    }
} catch (e) {
    console.error("Error reading .env:", e);
}
