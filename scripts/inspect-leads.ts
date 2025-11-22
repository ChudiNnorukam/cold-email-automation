import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectLeads() {
    console.log("🔍 Inspecting Leads...");

    const totalLeads = await prisma.lead.count();
    console.log(`Total Leads: ${totalLeads}`);

    const placeholderLeads = await prisma.lead.count({
        where: { email: { contains: '@placeholder.com' } }
    });
    console.log(`Leads with @placeholder.com: ${placeholderLeads}`);

    const unknownCompanies = await prisma.lead.count({
        where: { company: "Unknown" }
    });
    console.log(`Leads with company 'Unknown': ${unknownCompanies}`);

    console.log("\n--- Sample Leads (Last 10) ---");
    const samples = await prisma.lead.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    console.log(samples);
}

inspectLeads()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
