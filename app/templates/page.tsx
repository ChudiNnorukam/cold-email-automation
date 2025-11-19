import prisma from "@/lib/prisma";
import { deleteTemplate, seedTemplates } from "@/app/actions";
import { Trash2, Sparkles } from "lucide-react";
import { CreateTemplateForm } from "@/components/CreateTemplateForm";

export default async function TemplatesPage() {
    const templates = await prisma.template.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
                <form action={seedTemplates}>
                    <button
                        type="submit"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        <Sparkles className="h-4 w-4" /> Load Examples
                    </button>
                </form>
            </div>

            <CreateTemplateForm />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                    <div key={template.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                <p className="text-sm text-gray-500">Subject: {template.subject}</p>
                            </div>
                            <form action={deleteTemplate.bind(null, template.id)}>
                                <button type="submit" className="text-gray-400 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                        <div className="flex-1 bg-gray-50 p-4 rounded-md text-sm font-mono text-gray-700 whitespace-pre-wrap mb-4">
                            {template.body}
                        </div>
                    </div>
                ))}
                {templates.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No templates yet. Create one or load examples.
                    </div>
                )}
            </div>
        </div>
    );
}
