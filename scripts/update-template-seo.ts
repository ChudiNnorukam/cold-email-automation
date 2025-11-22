import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTemplate() {
    console.log("📝 Updating Email Template...");

    const templateName = "Modern Redesign Pitch Template";
    const newBody = `Hi {{Name}},

I was checking out {{Company}}'s website today and ran a quick performance test. I noticed a few SEO and speed issues that are likely costing you visitors.

I'd love to send you a **free audit report** explaining exactly how these issues impact your business in plain English.

If you find the report helpful, I can also offer to **update your website for an affordable price** to fix everything and get you more customers.

Are you open to seeing the report?

Best,
Chudi Nnorukam`;

    try {
        const result = await prisma.template.updateMany({
            where: { name: templateName },
            data: {
                body: newBody,
                subject: "Quick question about {{Company}}'s website"
            }
        });

        if (result.count > 0) {
            console.log(`✅ Updated ${result.count} template(s).`);
            console.log("\n--- NEW BODY ---");
            console.log(newBody);
            console.log("----------------");
        } else {
            console.error(`❌ Template '${templateName}' not found.`);
        }

    } catch (e) {
        console.error("Error updating template:", e);
    } finally {
        await prisma.$disconnect();
    }
}

updateTemplate();
