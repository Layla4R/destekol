"use client";
import { useAdminBranding } from "@/components/admin/AdminBranding";
import Icon from "@/components/icons";
import { storeAdminToken } from "@/lib/admin-fetch";
import Image from "next/image";
import { useRouter,useSearchParams } from "next/navigation";
import { useState } from "react";
export default function AcceptInviteClient() {
    const brand = useAdminBranding();
    const params = useSearchParams();
    const router = useRouter();
    const token = params.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            setError("Password must contain at least one letter and one number");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/admin/accept-invite", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const d = await res.json();
            if (!res.ok)
                throw new Error(d.error);
            setDone(true);
            if (d.token) {
                storeAdminToken(d.token);
                setTimeout(() => router.push("/admin"), 2000);
            }
            else {
                setTimeout(() => router.push("/admin/login?accepted=1"), 2000);
            }
        }
        catch (e: any) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    const inp = "w-full rounded-xl border border-line bg-dashbg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
    return (<div className="min-h-screen flex items-center justify-center bg-brand-gradient px-6 py-12 overflow-hidden relative">
      <div className="absolute -left-32 -top-32 w-96 h-96 rounded-full border border-white/10 hidden sm:block"/>
      <div className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full border border-white/10 hidden sm:block"/>
      <div className="relative bg-white rounded-2xl shadow-2xl border border-line w-full max-w-md overflow-hidden">
        <div className="bg-brand-gradient p-8 text-center">
          <Image src={brand.logo} alt={brand.name} width={208} height={84} className={`h-10 mx-auto mb-3 ${brand.name === "Destekol" ? "w-52 object-cover" : "w-auto object-contain"}`}/>
          <span className="inline-block text-white/70 text-xs font-bold tracking-widest uppercase">Admin Panel Invitation</span>
        </div>
        <div className="p-8">
          {!token ? (<div className="text-center"><Icon name="x" size={36} className="text-danger mx-auto mb-3"/>
              <h1 className="font-display text-xl font-extrabold text-ink mb-2">Invalid Link</h1>
              <p className="text-muted text-sm">This invitation link is invalid or has expired.</p>
            </div>) : done ? ( // accepted
        <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={32} className="text-success"/>
              </div>
              <h1 className="font-display text-xl font-extrabold text-ink mb-2">Account Created!</h1>
              <p className="text-muted text-sm">Redirecting you to sign in...</p>
            </div>) : (<>
              <h1 className="font-display text-xl font-extrabold text-ink mb-1">Set Your Password</h1>
              <p className="text-muted text-sm mb-6">Create a strong password to activate your admin account.</p>
              <form onSubmit={submit} className="space-y-4">
                <div><label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">New Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inp} placeholder="Minimum 8 characters"/></div>
                <div><label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className={inp}/></div>
                {error && <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-xl p-3 text-sm text-danger"><Icon name="x" size={14} className="shrink-0"/>{error}</div>}
                <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-3.5 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  <Icon name="shield-check" size={16}/>
                  {loading ? "Setting up your account..." : "Activate Account"}
                </button>
              </form>
            </>)}
        </div>
      </div>
    </div>);
}
