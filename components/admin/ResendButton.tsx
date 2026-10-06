"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useState } from "react";
export default function ResendButton({ donationId, email }: {
    donationId: string;
    email: string;
}) {
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    async function resend() {
        if (!confirm(`Resend receipt to ${email}?`))
            return;
        setStatus("sending");
        try {
            const res = await adminFetch("/api/admin/invoices/resend", {
                method: "POST",
                body: JSON.stringify({ donationId }),
            });
            setStatus(res.ok ? "sent" : "error");
            if (res.ok)
                setTimeout(() => setStatus("idle"), 3000);
        }
        catch {
            setStatus("error");
        }
    }
    return (<button onClick={resend} disabled={status === "sending" || status === "sent"} className={`flex items-center gap-1.5 text-xs border font-bold rounded-lg px-3 py-1.5 transition ${status === "sent" ? "border-success text-success bg-success/10" :
            status === "error" ? "border-danger text-danger bg-danger/10" :
                "border-brand text-brand hover:bg-brand hover:text-white"}`}>
      <Icon name={status === "sent" ? "check" : status === "error" ? "x" : "send"} size={12}/>
      {status === "sending" ? "Sending…" : status === "sent" ? "Sent!" : status === "error" ? "Failed" : "Resend"}
    </button>);
}
