'use client';

import { deleteTemplate } from "@/app/actions";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        startTransition(async () => {
            await deleteTemplate(templateId);
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-gray-400 hover:text-red-600 disabled:opacity-50"
            aria-label="Delete template"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
