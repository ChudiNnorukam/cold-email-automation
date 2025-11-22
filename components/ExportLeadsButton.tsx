'use client';

import { Download } from 'lucide-react';

interface Lead {
    name: string;
    email: string;
    company: string;
    status: string;
    sentAt?: string;
    error?: string;
}

export default function ExportLeadsButton({ leads, campaignName }: { leads: any[], campaignName: string }) {
    const handleExport = () => {
        // 1. Prepare Data
        const headers = ['Name', 'Email', 'Company', 'Status', 'Sent At', 'Error'];
        const rows = leads.map(item => [
            item.lead.name,
            item.lead.email,
            item.lead.company,
            item.status,
            item.sentAt ? new Date(item.sentAt).toLocaleString() : '',
            item.errorMessage || ''
        ]);

        // 2. Convert to CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // 3. Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${campaignName.replace(/\s+/g, '_')}_leads.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
        >
            <Download className="w-4 h-4" />
            Export CSV
        </button>
    );
}
