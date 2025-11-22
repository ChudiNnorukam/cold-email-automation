'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function enrichLead(leadId: string) {
    try {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) throw new Error('Lead not found');

        // Simulate API call to enrichment service (e.g., Clearbit, Apollo)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock Data
        const enrichedData = {
            linkedin: `https://linkedin.com/in/${lead.name.replace(/\s+/g, '-').toLowerCase()}`,
            jobTitle: 'Owner / CEO',
            location: 'San Francisco, CA',
            companySize: '1-10 employees'
        };

        // Update Lead Notes with enriched data (since we don't have dedicated fields yet)
        const newNotes = `
--- Enriched Data (${new Date().toLocaleDateString()}) ---
LinkedIn: ${enrichedData.linkedin}
Title: ${enrichedData.jobTitle}
Location: ${enrichedData.location}
Size: ${enrichedData.companySize}
    `.trim();

        await prisma.lead.update({
            where: { id: leadId },
            data: {
                notes: lead.notes ? `${lead.notes}\n\n${newNotes}` : newNotes
            }
        });

        revalidatePath('/campaigns');
        return { success: true, data: enrichedData };
    } catch (error: any) {
        console.error('Enrichment failed:', error);
        return { success: false, error: error.message };
    }
}
