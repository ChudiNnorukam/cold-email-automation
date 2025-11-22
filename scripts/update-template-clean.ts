import prisma from '../lib/prisma';

async function cleanTemplate() {
    const templateName = "No Website - The 'Digital Ghost'";
    console.log(`Cleaning template: ${templateName}...`);

    const template = await prisma.template.findFirst({
        where: { name: templateName }
    });

    if (!template) {
        console.error("Template not found!");
        return;
    }

    // Remove the explicit links from the body
    // The current body likely ends with:
    // Best,
    // Chudi Nnorukam
    // Portfolio: ...
    // LinkedIn: ...

    // We want to keep "Best,\nChudi Nnorukam" and remove the rest.

    // Let's use a regex to remove lines starting with "Portfolio:" and "LinkedIn:"
    let newBody = template.body.replace(/Portfolio: https?:\/\/.*\n?/g, '');
    newBody = newBody.replace(/LinkedIn: https?:\/\/.*\n?/g, '');

    // Trim trailing whitespace
    newBody = newBody.trim();

    await prisma.template.update({
        where: { id: template.id },
        data: { body: newBody }
    });

    console.log("✅ Template updated successfully.");
    console.log("New Body Preview:\n", newBody);
}

cleanTemplate();
