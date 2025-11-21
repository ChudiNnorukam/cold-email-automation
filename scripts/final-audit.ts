import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function audit() {
    console.log("🔍 Starting Final System Audit...\n");
    let errors = 0;

    // 1. Check Database Connection & Schema
    try {
        console.log("Checking Database Connection...");
        const campaignCount = await prisma.campaign.count();
        console.log(`✅ Database connected. Found ${campaignCount} campaigns.`);

        // Check for new fields
        const campaigns = await prisma.campaign.findMany({ take: 1 });
        if (campaigns.length > 0 && 'searchQuery' in campaigns[0]) {
            console.log("✅ Schema check passed: 'searchQuery' field exists on Campaign.");
        } else {
            console.log("⚠️ Schema warning: 'searchQuery' field might be missing (or no campaigns to check).");
        }

        const smtpConfig = await prisma.smtpConfig.findFirst();
        if (smtpConfig && 'isSystemPaused' in smtpConfig) {
            console.log("✅ Schema check passed: 'isSystemPaused' field exists on SmtpConfig.");
        } else {
            console.log("⚠️ Schema warning: 'isSystemPaused' field might be missing.");
        }

    } catch (error) {
        console.error("❌ Database check failed:", error);
        errors++;
    }

    // 2. Check Vercel Configuration
    try {
        console.log("\nChecking vercel.json...");
        const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
        if (fs.existsSync(vercelJsonPath)) {
            const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
            const crons = vercelConfig.crons || [];

            const sendEmails = crons.find((c: any) => c.path === '/api/cron/send-emails');
            const findLeads = crons.find((c: any) => c.path === '/api/cron/find-leads');

            if (sendEmails && sendEmails.schedule === "0 10 * * *") {
                console.log("✅ Cron 'send-emails' configured correctly (Daily at 10 AM).");
            } else {
                console.error("❌ Cron 'send-emails' configuration mismatch. Expected '0 10 * * *'.");
                errors++;
            }

            if (findLeads) {
                console.log("✅ Cron 'find-leads' configured.");
            } else {
                console.error("❌ Cron 'find-leads' missing.");
                errors++;
            }
        } else {
            console.error("❌ vercel.json not found.");
            errors++;
        }
    } catch (error) {
        console.error("❌ Vercel config check failed:", error);
        errors++;
    }

    // 3. Check Code Integrity (Shared Library Usage)
    try {
        console.log("\nChecking Code Integrity...");

        const sendEmailsRoute = fs.readFileSync(path.join(process.cwd(), 'app/api/cron/send-emails/route.ts'), 'utf-8');
        if (sendEmailsRoute.includes("processEmailQueue")) {
            console.log("✅ 'send-emails' route uses shared library.");
        } else {
            console.error("❌ 'send-emails' route does NOT use shared library.");
            errors++;
        }

        const findLeadsRoute = fs.readFileSync(path.join(process.cwd(), 'app/api/cron/find-leads/route.ts'), 'utf-8');
        if (findLeadsRoute.includes("findNewLeads")) {
            console.log("✅ 'find-leads' route uses shared library.");
        } else {
            console.error("❌ 'find-leads' route does NOT use shared library.");
            errors++;
        }

        const settingsPage = fs.readFileSync(path.join(process.cwd(), 'app/settings/page.tsx'), 'utf-8');
        if (settingsPage.includes("runManualCron")) {
            console.log("✅ Settings page uses 'runManualCron' server action.");
        } else {
            console.error("❌ Settings page does NOT use 'runManualCron' server action.");
            errors++;
        }

    } catch (error) {
        console.error("❌ Code integrity check failed:", error);
        errors++;
    }

    console.log("\n--------------------------------------------------");
    if (errors === 0) {
        console.log("🎉 AUDIT PASSED: System is healthy and correctly configured.");
    } else {
        console.log(`⚠️ AUDIT FAILED: Found ${errors} issues.`);
    }
}

audit();
