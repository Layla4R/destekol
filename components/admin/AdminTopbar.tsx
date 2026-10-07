"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { usePathname } from "next/navigation";
import { useEffect,useState } from "react";
const PAGE_TITLES: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/pages": "Pages",
    "/admin/campaigns": "Campaigns",
    "/admin/messages": "Contact Messages",
    "/admin/donations": "Donations",
    "/admin/invoices": "Invoices & Receipts",
    "/admin/settings": "Settings",
    "/admin/posts": "News & Blog",
    "/admin/subscribers": "Email Subscribers",
    "/admin/users": "User Management",
    "/admin/donors": "Donor Accounts",
    "/admin/reports": "Analytics & Reports",
    "/admin/staff": "Staff & Permissions",
    "/admin/appearance": "Appearance Editor",
    "/admin/emails": "Email Templates",
    "/admin/translations": "Translations",
    "/admin/campaigns/new": "New Campaign",
    "/admin/posts/new": "New Post",
};
export default function AdminTopbar() {
    const pathname = usePathname() || "";
    const [admin, setAdmin] = useState<{
        name: string;
        email: string;
        role: string;
        isStaff?: boolean;
    } | null>(null);
    const title = (() => {
        const sorted = Object.entries(PAGE_TITLES).sort((a, b) => b[0].length - a[0].length);
        const match = sorted.find(([k]) => pathname === k || pathname.startsWith(k + "/"));
        if (match)
            return match[1];
        if (pathname?.startsWith("/admin/campaigns/"))
            return "Edit Campaign";
        if (pathname?.startsWith("/admin/posts/"))
            return "Edit Post";
        if (pathname?.startsWith("/admin/pages/"))
            return "Page Editor";
        if (pathname?.startsWith("/admin/donors/"))
            return "Donor Profile";
        if (pathname?.startsWith("/admin/users/"))
            return "User Details";
        return "Admin";
    })();
    useEffect(() => {
        // Check sessionStorage cache (refresh if older than 60s)
        const CACHE_KEY = "destekol_admin_me";
        const CACHE_TS_KEY = "destekol_admin_me_ts";
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            const ts = Number(sessionStorage.getItem(CACHE_TS_KEY) || "0");
            if (cached && Date.now() - ts < 60000) {
                setAdmin(JSON.parse(cached));
                return;
            } // Fresh cache
        }
        catch { }
        // Cache miss or stale — fetch from server
        adminFetch("/api/admin/auth/me").then(r => r.ok ? r.json() : null).then(d => {
            if (d?.admin) {
                setAdmin(d.admin);
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(d.admin));
                sessionStorage.setItem(CACHE_TS_KEY, String(Date.now()));
            }
        }).catch(() => { });
    }, []);
    return (<header className="h-14 bg-white border-b border-line flex items-center justify-between px-6 shrink-0">
      <div className="font-bold text-ink text-sm">{title}</div>
      <div className="flex items-center gap-3">
        {/* View site */}
        <a href="/" target="_blank" className="flex items-center gap-1.5 text-xs text-muted hover:text-ink border border-line rounded-lg px-3 py-1.5 transition hover:border-brand">
          <Icon name="globe" size={13}/> View Site
        </a>
        {/* User badge */}
        {admin && (<div className="flex items-center gap-2 bg-dashbg border border-line rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-brand/15 text-brand flex items-center justify-center text-xs font-bold">
              {(admin.name || admin.email)[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-ink leading-none">{admin.name || admin.email.split("@")[0]}</div>
              <div className="text-[10px] text-muted leading-none mt-0.5">{admin.isStaff ? ({EDITOR:"Content Editor",VIEWER:"Viewer",FINANCE:"Finance Manager",COMPLAINTS:"Complaints Officer",ADMIN:"Administrative Staff"} as Record<string,string>)[admin.role] || admin.role : "Owner"}</div>
            </div>
          </div>)}

      </div>
    </header>);
}
