"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
export default function CartIcon({ prefix = "", transparent = false }: {
    prefix?: string;
    transparent?: boolean;
}) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        function update() {
            try {
                const cart = JSON.parse(sessionStorage.getItem("destekol_cart") || "[]");
                setCount(cart.length);
            }
            catch { }
        }
        // Immediate update on mount
        update();
        // Listen for storage events (dispatched by cart operations)
        window.addEventListener("storage", update);
        // Minimal interval as last-resort fallback (2s is enough)
        const t = setInterval(update, 2000);
        return () => {
            window.removeEventListener("storage", update);
            clearInterval(t);
        };
    }, []);
    return (<Link href={`${prefix}/cart`} className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition ${transparent
            ? "border-white/30 text-white hover:bg-white/15"
            : "border-line text-ink/60 hover:border-brand hover:text-brand"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      {count > 0 && (<span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>)}
    </Link>);
}
