"use client";
import { useState } from "react";
export default function NewsletterForm({ buttonText, placeholder, successText }: {
    locale?: string;
    buttonText?: string;
    placeholder?: string;
    successText?: string;
}) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("sending");
        try {
            await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
        }
        catch { }
        setStatus("sent");
    }
    return (<form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input required type="email" placeholder={placeholder || ""} value={email} onChange={(e) => setEmail(e.target.value)} className="newsletter-email flex-1 rounded-xl border border-line bg-white py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand/40"/>
      <button type="submit" disabled={status !== "idle"} className="newsletter-submit bg-accent-gradient hover:opacity-90 text-white font-bold rounded-xl py-3 px-6 transition disabled:opacity-60">
        {status === "sent" ? successText || "" : status === "sending" ? "..." : buttonText || ""}
      </button>
    </form>);
}
