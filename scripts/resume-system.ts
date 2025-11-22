import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resumeSystem() {
    console.log("▶️ Resuming System...");

    try {
        const result = await prisma.smtpConfig.updateMany({
            data: { isSystemPaused: false }
        });
        console.log(`✅ System Resumed. Updated ${result.count} config(s).`);
    } catch (e) {
        console.error("❌ Failed to resume system:", e);
    } finally {
        await prisma.$disconnect();
    }
}

resumeSystem();
