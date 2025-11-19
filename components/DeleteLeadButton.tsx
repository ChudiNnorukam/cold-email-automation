'use client';

import { deleteLead } from "@/app/actions";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this lead?")) return;

        startTransition(async () => {
            await deleteLead(leadId);
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
            aria-label="Delete lead"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
