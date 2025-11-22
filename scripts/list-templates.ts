import prisma from '../lib/prisma';

async function listTemplates() {
    const templates = await prisma.template.findMany();
    console.log("Available Templates:");
    templates.forEach(t => {
        console.log(`- [${t.id}] ${t.name}`);
        console.log(`  Subject: ${t.subject}`);
        console.log(`  Body Preview: ${t.body.substring(0, 50)}...`);
        console.log("---");
    });
}

listTemplates();
