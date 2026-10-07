"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function MessageActions({ id, isRead, email, canEdit = false, canDelete = false }: {
    canEdit?: boolean;
    canDelete?: boolean;
    id: string;
    isRead: boolean;
    email: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    async function toggleRead() {
        setLoading(true);
        await adminFetch(`/api/admin/messages/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ isRead: !isRead }),
        });
        router.refresh();
        setLoading(false);
    }
    async function deleteMsg() {
        if (!confirm("Delete this message?"))
            return;
        setLoading(true);
        await adminFetch(`/api/admin/messages/${id}`, { method: "DELETE" });
        router.refresh();
        setLoading(false);
    }
    return (<div className="flex items-center gap-1.5">
      <a href={`mailto:${email}`} className="flex items-center gap-1 text-xs border border-line text-muted rounded-lg px-2.5 py-1.5 hover:border-brand hover:text-brand transition">
        <Icon name="mail" size={12}/> Reply
      </a>
      {canEdit && <button onClick={toggleRead} disabled={loading} title={isRead ? "Mark as unread" : "Mark as read"} className="flex items-center gap-1 text-xs border border-line text-muted rounded-lg px-2.5 py-1.5 hover:border-brand hover:text-brand transition">
        <Icon name={isRead ? "help-circle" : "check"} size={12}/>
        {isRead ? "Unread" : "Read"}
      </button>}
      {canDelete && <button onClick={deleteMsg} disabled={loading} className="flex items-center gap-1 text-xs border border-line text-muted rounded-lg px-2.5 py-1.5 hover:border-danger hover:text-danger transition">
        <Icon name="trash" size={12}/>
      </button>}
    </div>);
}
