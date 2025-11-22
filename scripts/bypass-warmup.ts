import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bypassWarmup() {
    console.log("🔓 Bypassing Warm-up Limits...");

    const config = await prisma.smtpConfig.findFirst();
    if (!config) return;

    // Set createdAt to 20 days ago
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 20);

    await prisma.smtpConfig.update({
        where: { id: config.id },
        data: { createdAt: oldDate }
    });

    console.log("✅ Account age updated to 20 days. Warm-up disabled.");
}

bypassWarmup()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
