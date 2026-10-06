"use client";
import { useAdminBranding } from "@/components/admin/AdminBranding";
import Icon from "@/components/icons";
import { storeAdminToken } from "@/lib/admin-fetch";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function AdminLogin() {
    const brand = useAdminBranding();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    // async function submit(e: React.FormEvent) {
    //   e.preventDefault();
    //     console.log("1- Submit clicked");
    //   setError("");
    //   setLoading(true);
    //   try {
    //     const res = await fetch("/api/admin/auth/login", {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       credentials: "include",
    //       body: JSON.stringify({ email, password }),
    //     });
    //         console.log("2- Response status:", res.status);
    //     const data = await res.json();
    //     if (!res.ok) throw new Error(data.error || "Sign in failed");
    //     if (data.token) storeAdminToken(data.token);
    //     router.push("/admin");
    //     router.refresh();
    //   } catch (e: any) {
    //     setError(e.message);
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        console.log("1- Submit clicked");
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });
            console.log("2- Response status:", res.status);
            const data = await res.json();
            console.log("3- Response data:", data);
            if (!res.ok)
                throw new Error(data.error || "Sign in failed");
            if (data.token) {
                console.log("4- Storing token");
                storeAdminToken(data.token);
            }
            console.log("5- Before router.push");
            router.push("/admin");
            console.log("6- After router.push");
            router.refresh();
            console.log("7- After router.refresh");
        }
        catch (e: any) {
            console.error("ERROR:", e);
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    return (<div className="relative min-h-screen flex items-center justify-center bg-brand-gradient px-6 overflow-hidden">
      <div className="absolute -left-32 -top-32 w-96 h-96 rounded-full border border-white/10 hidden sm:block"/>
      <div className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full border border-white/10 hidden sm:block"/>

      <form onSubmit={submit} className="relative bg-white rounded-2xl shadow-2xl border border-line p-8 w-full max-w-md space-y-5">
        <div className="text-center mb-2">
          <Image src={brand.logo} alt={brand.name} width={240} height={96} className={`h-12 mx-auto mb-5 ${brand.name === "Destekol" ? "w-60 object-cover" : "w-auto object-contain"}`}/>
          <span className="inline-flex items-center gap-2 text-brand-light font-display font-bold text-xs tracking-[0.25em] uppercase mb-2">
            <span className="inline-block w-6 h-px bg-brand-light"/>
            Admin Panel
          </span>
          <h1 className="font-display text-xl font-extrabold text-ink">Admin Sign In</h1>
          <p className="text-muted text-sm mt-1">Sign in to access the visual editor and admin panel</p>
        </div>
        <div>
          <label className="block text-sm text-muted mb-1.5">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-line bg-cream py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand/40"/>
        </div>
        <div>
          <label className="block text-sm text-muted mb-1.5">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-line bg-cream py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand/40"/>
        </div>
        {error && (<p className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg p-3">
            <Icon name="x" size={16} className="shrink-0"/>
            {error}
          </p>)}
        <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-3 transition disabled:opacity-60">
          {loading ? "..." : "Sign In"}
        </button>
      </form>
    </div>);
}
