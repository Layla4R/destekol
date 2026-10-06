"use client";
import Icon from "@/components/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense,useState } from "react";
function ResetClientContent({ locale, dict: D }: {
    locale: string;
    dict: Record<string, string>;
}) {
    const params = useSearchParams();
    const token = params.get("token") || "";
    const p = locale === "ar" ? "" : `/${locale}`;
    const [pw, setPw] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (pw !== confirm) {
            setError(D["auth.password_mismatch"]);
            return;
        }
        if (pw.length < 8) {
            setError(D["auth.password_short"]);
            return;
        }
        setError("");
        setLoading(true);
        const res = await fetch("/api/donor/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: pw }) });
        const d = await res.json();
        if (!res.ok) {
            setError(d.error || "Error");
            setLoading(false);
            return;
        }
        setDone(true);
        setLoading(false);
    }
    const inp = "w-full rounded-xl border border-line bg-cream py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
    return (<div className="min-h-[60vh] flex items-center justify-center bg-section-gradient px-6 py-16">
      <div className="bg-white rounded-2xl shadow-xl border border-line p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Icon name="shield-check" size={36} className="text-brand mx-auto mb-3"/>
          <h1 className="font-display text-2xl font-extrabold text-ink">{D["auth.reset_title"]}</h1>
        </div>
        {done ? (<div className="text-center">
            <p className="text-muted mb-4">{D["auth.back_to_login"]}</p>
            <Link href={`${p}/login`} className="bg-brand text-white font-bold rounded-xl px-6 py-3 inline-block hover:bg-brand-dark transition">
              {D["auth.sign_in"]}
            </Link>
          </div>) : (<form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">{D["auth.new_password"]}</label>
              <input type="password" required value={pw} onChange={e => setPw(e.target.value)} className={inp}/>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">{D["auth.confirm_password"]}</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className={inp}/>
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-3 transition disabled:opacity-60">
              {loading ? "..." : D["auth.set_password"]}
            </button>
          </form>)}
      </div>
    </div>);
}
export default function ResetClient(props: {
    locale: string;
    dict: Record<string, string>;
}) {
    return (<Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>}>
      <ResetClientContent {...props}/>
    </Suspense>);
}
