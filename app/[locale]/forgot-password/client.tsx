"use client";
import Icon from "@/components/icons";
import Link from "next/link";
import { useState } from "react";
export default function ForgotClient({ locale, dict: D }: {
    locale: string;
    dict: Record<string, string>;
}) {
    const p = locale === "ar" ? "" : `/${locale}`;
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        await fetch("/api/donor/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
        setSent(true);
        setLoading(false);
    }
    return (<div className="min-h-[60vh] flex items-center justify-center bg-section-gradient px-6 py-16">
      <div className="bg-white rounded-2xl shadow-xl border border-line p-8 w-full max-w-md text-center">
        <Icon name="mail" size={36} className="text-brand mx-auto mb-4"/>
        <h1 className="font-display text-2xl font-extrabold text-ink mb-2">{D["auth.reset_title"]}</h1>
        {sent ? <><p className="text-muted mb-4">{D["auth.reset_sent"]}</p><Link href={`${p}/login`} className="text-brand hover:underline text-sm">{D["auth.sign_in"]}</Link></>
            : <form onSubmit={submit} className="space-y-4 text-start mt-4">
            <div><label className="block text-sm text-muted mb-1.5">{D["auth.email"]}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-line bg-cream py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"/></div>
            <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-3 transition disabled:opacity-60">{loading ? "..." : D["auth.send_reset"]}</button>
            <Link href={`${p}/login`} className="block text-center text-sm text-muted hover:text-ink">{D["auth.sign_in"]}</Link>
          </form>}
      </div>
    </div>);
}
