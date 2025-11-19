'use client'

import { useState, useEffect } from "react";
import { updateLeadStatus } from "@/app/actions";
import { Copy, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Lead = {
    id: string;
    name: string;
    email: string;
    company: string;
    status: string;
    notes: string | null;
};

type Template = {
    id: string;
    name: string;
    subject: string;
    body: string;
};

export default function OutreachWorkbench({ lead, templates }: { lead: Lead; templates: Template[] }) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || "");
    const [generatedBody, setGeneratedBody] = useState("");
    const [generatedSubject, setGeneratedSubject] = useState("");
    const [copied, setCopied] = useState(false);

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

    useEffect(() => {
        if (selectedTemplate) {
            const myPortfolio = "https://chudi-nnorukam-portfolio.vercel.app/";
            const myLinkedIn = "https://www.linkedin.com/in/chudi-nnorukam-b91203143/";

            let body = selectedTemplate.body
                .replace(/{{Name}}/g, lead.name)
                .replace(/{{Company}}/g, lead.company)
                .replace(/{{MyPortfolio}}/g, myPortfolio)
                .replace(/{{MyLinkedIn}}/g, myLinkedIn);

            let subject = selectedTemplate.subject
                .replace(/{{Name}}/g, lead.name)
                .replace(/{{Company}}/g, lead.company);

            setGeneratedBody(body);
            setGeneratedSubject(subject);
        }
    }, [selectedTemplate, lead]);

    const handleCopy = () => {
        navigator.clipboard.writeText(`${generatedSubject}\n\n${generatedBody}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleMailTo = async () => {
        const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(generatedSubject)}&body=${encodeURIComponent(generatedBody)}`;
        window.open(mailtoLink, '_blank');
        await updateLeadStatus(lead.id, "CONTACTED");
    };

    const handleStatusUpdate = async (status: string) => {
        await updateLeadStatus(lead.id, status);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
            {/* Left Sidebar: Lead Info */}
            <div className="lg:col-span-1 space-y-6">
                <Link href="/leads" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Leads
                </Link>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{lead.name}</h2>
                    <div className="space-y-3 text-sm">
                        <div>
                            <label className="text-gray-500 block">Company</label>
                            <div className="font-medium">{lead.company}</div>
                        </div>
                        <div>
                            <label className="text-gray-500 block">Email</label>
                            <div className="font-medium">{lead.email}</div>
                        </div>
                        <div>
                            <label className="text-gray-500 block">Status</label>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {["NEW", "CONTACTED", "REPLIED", "INTERESTED", "NOT_INTERESTED"].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusUpdate(s)}
                                        className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors
                      ${lead.status === s
                                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {lead.notes && (
                            <div>
                                <label className="text-gray-500 block">Notes</label>
                                <div className="text-gray-700 bg-gray-50 p-2 rounded mt-1">{lead.notes}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold mb-3">Template Selection</h3>
                    <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                        {templates.length === 0 && <option value="">No templates found</option>}
                    </select>
                </div>
            </div>

            {/* Right Content: Email Preview */}
            <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Email Preview</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                        <button
                            onClick={handleMailTo}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                            <Mail className="h-4 w-4" /> Open Mail App
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Subject</label>
                            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-gray-900 font-medium">
                                {generatedSubject || "Select a template..."}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Body</label>
                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-gray-900 font-mono whitespace-pre-wrap min-h-[300px]">
                                {generatedBody || "Select a template..."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
