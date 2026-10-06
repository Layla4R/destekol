"use client";
import Icon from "@/components/icons";
import Link from "next/link";
import { useEffect } from "react";
export default function LocaleError({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production")
            console.error(error);
    }, [error]);
    return (<div className="min-h-[60vh] flex items-center justify-center px-6 py-16 bg-section-gradient">
      <div className="bg-white rounded-2xl border border-line shadow-xl p-10 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-5">
          <Icon name="x" size={28} className="text-danger"/>
        </div>
        <h1 className="font-display text-2xl font-extrabold text-ink mb-3">حدث خطأ</h1>
        <p className="text-muted mb-6 text-sm">Something went wrong. Please try again.</p>
        <div className="space-y-3">
          <button onClick={reset} className="block w-full bg-brand text-white font-bold rounded-xl px-6 py-3 hover:bg-brand-dark transition">
            Try Again
          </button>
          <Link href="/" className="block w-full border border-line text-muted font-bold rounded-xl px-6 py-3 hover:border-brand hover:text-brand transition">
            Go Home
          </Link>
        </div>
      </div>
    </div>);
}
