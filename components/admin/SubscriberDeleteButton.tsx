"use client";
import { adminFetch } from "@/lib/admin-fetch";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function SubscriberDeleteButton({ id }: {
    id: string;
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    async function del() {
        if (!confirm("Remove this subscriber?"))
            return;
        setLoading(true);
        try {
            const res = await adminFetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
            if (res.ok) {
                router.refresh();
            }
            else {
                alert("Failed to remove subscriber. Please try again.");
            }
        }
        catch {
            alert("Network error — could not remove subscriber.");
        }
        setLoading(false);
    }
    return (<button onClick={del} disabled={loading} className="text-xs text-danger hover:text-danger/70 transition font-semibold disabled:opacity-50">
      {loading ? "Removing…" : "Remove"}
    </button>);
}
