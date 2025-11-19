'use client'

import { createTemplate } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRef } from "react";

export function CreateTemplateForm() {
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(formData: FormData) {
        const result = await createTemplate(formData);
        if (result?.error) {
            alert(result.error);
        } else {
            formRef.current?.reset();
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Create Template</h2>
            <form ref={formRef} action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        name="name"
                        placeholder="Template Name (e.g. Initial Outreach)"
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        name="subject"
                        placeholder="Email Subject"
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <textarea
                    name="body"
                    placeholder="Email Body (Use {{Name}}, {{Company}}, {{MyPortfolio}}, {{MyLinkedIn}} as placeholders)"
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <div className="flex justify-end">
                    <Button type="submit" className="gap-2">
                        <Plus className="h-4 w-4" /> Save Template
                    </Button>
                </div>
            </form>
        </div>
    );
}
