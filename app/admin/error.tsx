"use client";
import Link from "next/link";
import { useEffect } from "react";
export default function AdminError({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production")
            console.error(error);
    }, [error]);
    return (<div className="min-h-[60vh] flex items-center justify-center bg-dashbg px-6 py-16">
      <div className="bg-white rounded-2xl border border-line shadow p-8 max-w-md text-center">
        <h1 className="font-display text-xl font-extrabold text-ink mb-3">Something went wrong</h1>
        <p className="text-muted text-sm mb-6">{error.message || "An unexpected error occurred."}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="bg-brand text-white font-bold rounded-xl px-5 py-2.5 text-sm hover:bg-brand-dark transition">
            Try Again
          </button>
          <Link href="/admin" className="border border-line text-muted font-bold rounded-xl px-5 py-2.5 text-sm hover:border-brand hover:text-brand transition">
            Dashboard
          </Link>
        </div>
      </div>
    </div>);
}
