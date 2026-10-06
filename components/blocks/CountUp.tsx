"use client";
import { useEffect,useRef,useState } from "react";
// Parses "12,540" or "$482,300" or "+3" or "أقل من 5%" into a numeric value
function parseValue(raw: string): {
    prefix: string;
    suffix: string;
    num: number;
} {
    const str = String(raw).trim();
    let prefix = "";
    let suffix = "";
    let core = str;
    // Extract leading non-numeric prefix (like $, +)
    const prefixMatch = core.match(/^([^0-9\u0660-\u0669]*)/);
    if (prefixMatch) {
        prefix = prefixMatch[1];
        core = core.slice(prefix.length);
    }
    // Extract trailing non-numeric suffix
    const numMatch = core.match(/^([\d,،.]+)/);
    if (numMatch) {
        suffix = core.slice(numMatch[1].length);
        core = numMatch[1].replace(/,|،/g, "");
    }
    const num = parseFloat(core) || 0;
    return { prefix, suffix, num };
}
function formatNum(n: number, originalHadCommas: boolean): string {
    if (!originalHadCommas)
        return String(Math.round(n));
    return Math.round(n).toLocaleString("en-US");
}
export default function CountUp({ value, className = "", }: {
    value: string;
    className?: string;
}) {
    const { prefix, suffix, num } = parseValue(value);
    const hasCommas = /[,،]/.test(value);
    const [current, setCurrent] = useState(0);
    const [started, setStarted] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        setIsHydrated(true);
    }, []);
    useEffect(() => {
        if (!isHydrated)
            return;
        const el = containerRef.current;
        if (!el)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setStarted(true);
                observer.disconnect();
            }
        }, { threshold: 0.3 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [isHydrated]);
    useEffect(() => {
        if (!started || num === 0)
            return;
        const duration = 2000; // ms
        const animate = (ts: number) => {
            if (!startRef.current)
                startRef.current = ts;
            const elapsed = ts - startRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(eased * num));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current)
                cancelAnimationFrame(rafRef.current);
        };
    }, [started, num]);
    return (<div ref={containerRef} className={`inline-block ${className}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {started
            ? `${prefix}${formatNum(current, hasCommas)}${suffix}`
            : value}
      </span>
    </div>);
}
