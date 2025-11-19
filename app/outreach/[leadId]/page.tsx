import prisma from "@/lib/prisma";
import OutreachWorkbench from "@/components/OutreachWorkbench";
import { notFound } from "next/navigation";

export default async function OutreachPage({ params }: { params: Promise<{ leadId: string }> }) {
    const { leadId } = await params;

    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
    });

    const templates = await prisma.template.findMany({
        orderBy: { isDefault: "desc" },
    });

    if (!lead) {
        notFound();
    }

    return <OutreachWorkbench lead={lead} templates={templates} />;
}
