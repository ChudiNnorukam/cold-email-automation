import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    console.log("🧹 Cleaning up Mock Leads...");

    // Delete leads created by the failed run
    // Identified by the hardcoded note from generate-real-leads.ts
    const result = await prisma.lead.deleteMany({
        where: {
            notes: { contains: "Source: Google Places (No Website)" }
        }
    });

    console.log(`✅ Deleted ${result.count} mock leads.`);
}

cleanup()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
