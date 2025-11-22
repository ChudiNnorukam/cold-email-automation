import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function pauseSystem() {
    console.log("🛑 Pausing System (Kill Switch)...");

    try {
        const result = await prisma.smtpConfig.updateMany({
            data: { isSystemPaused: true }
        });
        console.log(`✅ System Paused. Updated ${result.count} config(s).`);
    } catch (e) {
        console.error("❌ Failed to pause system:", e);
    } finally {
        await prisma.$disconnect();
    }
}

pauseSystem();
