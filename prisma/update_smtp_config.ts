import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating SMTP Configuration...');

    // 1. Read .env manually to get the password
    const envPath = path.join(process.cwd(), '.env');
    let googleAppPassword = '';

    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/GOOGLE_APP_PASSWORD="(.+)"/);
        if (match) {
            googleAppPassword = match[1];
            console.log("Found GOOGLE_APP_PASSWORD in .env");
        }
    }

    if (!googleAppPassword) {
        console.error("Could not find GOOGLE_APP_PASSWORD in .env");
        return;
    }

    // 2. Update or Create SMTP Config
    // We assume we are using the existing user 'chudinnorukam@gmail.com' or we should read that too?
    // The previous check_smtp.ts showed 'chudinnorukam@gmail.com'.
    // We will update the password for the existing config.

    const config = await prisma.smtpConfig.findFirst();

    if (config) {
        await prisma.smtpConfig.update({
            where: { id: config.id },
            data: {
                password: googleAppPassword,
                secure: true,
                host: 'smtp.gmail.com',
                port: 465, // Gmail uses 465 for SSL or 587 for TLS. 
                // The error '535-5.7.8' often happens if using 587 with wrong settings.
                // Let's try 465 with secure: true, which is standard for 'smtps'.
                // Or 587 with secure: false (STARTTLS).
                // Nodemailer 'secure: true' means port 465.
                // Nodemailer 'secure: false' means port 587 (usually).
                // I'll set port 465 and secure true to be safe for Gmail.
            }
        });
        console.log(`Updated SMTP config for ${config.user}`);
    } else {
        // Create new if not exists (fallback)
        await prisma.smtpConfig.create({
            data: {
                provider: 'gmail',
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                user: 'chudinnorukam@gmail.com',
                password: googleAppPassword,
                fromName: 'Chudi Nnorukam',
                fromEmail: 'chudinnorukam@gmail.com'
            }
        });
        console.log("Created new SMTP config.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
