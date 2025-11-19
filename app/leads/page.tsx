import prisma from "@/lib/prisma";
import Link from "next/link";
import { Send } from "lucide-react";
import { AddLeadDialog } from "@/components/AddLeadDialog";
import { DeleteLeadButton } from "@/components/DeleteLeadButton";

export default async function LeadsPage() {
    const leads = await prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                <AddLeadDialog />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                                    <div className="text-sm text-gray-500">{lead.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{lead.company}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${lead.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                                            lead.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-800' :
                                                lead.status === 'REPLIED' ? 'bg-purple-100 text-purple-800' :
                                                    lead.status === 'INTERESTED' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                                    <Link
                                        href={`/outreach/${lead.id}`}
                                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                    >
                                        <Send className="h-4 w-4" /> Outreach
                                    </Link>
                                    <DeleteLeadButton leadId={lead.id} />
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No leads found. Add one above to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
