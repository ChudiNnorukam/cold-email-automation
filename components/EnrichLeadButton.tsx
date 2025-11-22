'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { enrichLead } from '@/app/actions/enrich-lead';

export default function EnrichLeadButton({ leadId }: { leadId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleEnrich = async () => {
        setIsLoading(true);
        try {
            const result = await enrichLead(leadId);
            if (result.success && result.data) {
                alert(`Enriched! Found: ${result.data.jobTitle} at ${result.data.companySize}`);
            } else {
                alert('Failed to enrich lead.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleEnrich}
            disabled={isLoading}
            className="text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50"
            title="Enrich Lead Data"
        >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-pulse text-purple-600' : ''}`} />
        </button>
    );
}
