import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const config = await prisma.smtpConfig.findFirst();
    if (config) {
        console.log("SMTP Config Found:", config.user);
    } else {
        console.log("No SMTP Config Found.");
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
