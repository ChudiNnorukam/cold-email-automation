import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const leadId = "8662ab4d-e9f2-4184-8be7-dde30e449548";
    const lead = await prisma.lead.findUnique({
        where: { id: leadId }
    });
    console.log("Lead:", lead);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
