"use client";
import Icon from "@/components/icons";
import { useState } from "react";
const AMOUNTS = [5, 10, 25, 50, 100];
export default function DonateClient({ locale, dict: D, initialAmount, initialFreq, campaignId, storyId, }: {
    locale: string;
    dict: Record<string, string>;
    initialAmount?: number;
    initialFreq?: "ONE_TIME" | "MONTHLY";
    campaignId?: string;
    storyId?: string;
}) {
    const [amount, setAmount] = useState(initialAmount || 25);
    const [custom, setCustom] = useState(initialAmount && ![5, 10, 25, 50, 100].includes(initialAmount) ? String(initialAmount) : "");
    const [freq, setFreq] = useState<"ONE_TIME" | "MONTHLY">(initialFreq || "ONE_TIME");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [anon, setAnon] = useState(false);
    const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
    const [error, setError] = useState("");
    const final = custom ? Number(custom) : amount;
    async function pay(provider: "stripe" | "paypal") {
        if (!name.trim() || !email.trim()) {
            setError(`${D["donate.name"]} & ${D["donate.email"]} required`);
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            setError(D["cart.invalid_email"] || "Invalid email address");
            return;
        }
        setLoading(provider);
        setError("");
        try {
            const endpoint = provider === "stripe" ? "/api/donations/checkout" : "/api/donations/paypal";
            const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: final, frequency: freq, donorName: name, donorEmail: email, message: msg, isAnonymous: anon, campaignId, storyId }) });
            const d = await res.json();
            if (d.url)
                window.location.href = d.url;
            else
                setError(d.error || D["common.error"] || "Error");
        }
        catch {
            setError(D["common.error"] || "Error");
        }
        finally {
            setLoading(null);
        }
    }
    const inp = "w-full rounded-xl border border-line bg-cream py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
    return (<div>
      <header className="relative py-16 bg-brand-gradient text-center overflow-hidden">
        <div className="relative max-w-xl mx-auto px-6">
          <h1 className="font-display text-4xl font-extrabold text-white">{D["donate.title"] || "Donate"}</h1>
          <p className="mt-3 text-white/75">{D["donate.subtitle"] || ""}</p>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-line shadow-xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-muted mb-2">{D["donate.frequency"]}</label>
            <div className="flex rounded-xl overflow-hidden border border-line">
              <button onClick={() => setFreq("ONE_TIME")} className={`flex-1 py-2.5 text-sm font-bold transition ${freq === "ONE_TIME" ? "bg-brand text-white" : "bg-white text-muted hover:bg-beige"}`}>{D["donate.one_time"]}</button>
              <button onClick={() => setFreq("MONTHLY")} className={`flex-1 py-2.5 text-sm font-bold transition ${freq === "MONTHLY" ? "bg-brand text-white" : "bg-white text-muted hover:bg-beige"}`}>{D["donate.monthly"]}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted mb-2">{D["donate.amount"]}</label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {AMOUNTS.map(a => (<button key={a} onClick={() => { setAmount(a); setCustom(""); }} className={`py-2.5 rounded-xl text-sm font-bold border transition ${final === a && !custom ? "bg-brand border-brand text-white" : "border-line bg-white text-ink hover:border-brand"}`}>
                  ${a}
                </button>))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-semibold">$</span>
              <input type="number" min={1} value={custom} onChange={e => setCustom(e.target.value)} placeholder={String(amount)} className="w-full rounded-xl border border-line bg-cream py-3 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"/>
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-muted mb-2">{D["donate.name"]} *</label><input value={name} onChange={e => setName(e.target.value)} className={inp}/></div>
          <div><label className="block text-sm font-semibold text-muted mb-2">{D["donate.email"]} *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inp}/></div>
          <div><label className="block text-sm font-semibold text-muted mb-2">{D["donate.message"]}</label><textarea value={msg} onChange={e => setMsg(e.target.value)} rows={2} className={`${inp} resize-none`}/></div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} className="accent-brand w-4 h-4"/>
            <span className="text-sm text-muted">{D["donate.anonymous"]}</span>
          </label>
          {error && <p className="text-danger text-sm flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-xl p-3"><Icon name="x" size={14}/>{error}</p>}
          <div className="space-y-3">
            <button onClick={() => pay("stripe")} disabled={!!loading} className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-3.5 transition disabled:opacity-60 flex items-center justify-center gap-2">
              <Icon name="wallet" size={18}/>{loading === "stripe" ? "..." : `${D["donate.pay_card"]} — $${final}`}
            </button>
            <button onClick={() => pay("paypal")} disabled={!!loading} className="w-full bg-[#0070BA] hover:bg-[#005EA6] text-white font-bold rounded-xl py-3.5 transition disabled:opacity-60 flex items-center justify-center gap-2">
              <Icon name="wallet" size={18}/>{loading === "paypal" ? "..." : `${D["donate.pay_paypal"]} — $${final}`}
            </button>
          </div>
          <p className="text-xs text-muted text-center flex items-center justify-center gap-1.5"><Icon name="shield-check" size={13}/>{D["donate.secure"]}</p>
        </div>
      </div>
    </div>);
}
