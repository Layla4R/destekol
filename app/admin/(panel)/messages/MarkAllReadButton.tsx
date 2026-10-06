"use client";
import { adminFetch } from "@/lib/admin-fetch";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function MarkAllReadButton() {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const router = useRouter();
    async function markAll() {
        setLoading(true);
        try {
            await adminFetch("/api/admin/messages/mark-all-read", { method: "POST" });
            setDone(true);
            router.refresh();
            setTimeout(() => setDone(false), 3000);
        }
        catch { }
        setLoading(false);
    }
    return (<button onClick={markAll} disabled={loading} className={`px-4 py-2 rounded-xl text-sm font-bold border transition disabled:opacity-50 ${done ? "border-success/30 text-success bg-success/10" : "border-success/30 text-success hover:bg-success/10"}`}>
      {loading ? "Marking…" : done ? "✓ All marked as read!" : "✓ Mark All Read"}
    </button>);
}
