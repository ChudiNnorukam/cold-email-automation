import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing template grammar...');

    const templateName = "Modern Redesign - The 'Fresh Look'";
    const template = await prisma.template.findFirst({
        where: { name: templateName }
    });

    if (!template) {
        console.error("Template not found.");
        return;
    }

    // Old: "...stand out from other [City] competitors."
    // New: "...stand out from competitors in [City]."
    const newBody = template.body.replace(
        "stand out from other [City] competitors",
        "stand out from competitors in [City]"
    );

    await prisma.template.update({
        where: { id: template.id },
        data: { body: newBody }
    });

    console.log("Template updated successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
