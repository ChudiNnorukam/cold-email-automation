
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.lead.deleteMany({
        where: {
            OR: [
                { website: { contains: "facebook.com" } },
                { website: { contains: "reddit.com" } },
                { website: { contains: "dev.to" } }
            ]
        }
    });
    console.log(`Deleted ${deleted.count} bad leads.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
