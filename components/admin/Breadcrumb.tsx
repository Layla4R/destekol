"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const LABELS: Record<string, string> = {
    admin: "Dashboard", campaigns: "Campaigns", posts: "News & Blog",
    pages: "Pages", donations: "Donations", invoices: "Invoices",
    subscribers: "Subscribers", donors: "Donors", reports: "Reports",
    settings: "Settings", staff: "Staff", users: "Users",
    translations: "Translations", new: "New", edit: "Edit",
    appearance: "Appearance", emails: "Email Templates",
    messages: "Messages", "accept-invite": "Accept Invite",
};
export default function Breadcrumb() {
    const pathname = usePathname() || "";
    // Only show on sub-pages, not on main admin sections
    const segments = pathname.split("/").filter(Boolean); // ["admin","campaigns","123"]
    if (segments.length <= 2)
        return null; // /admin or /admin/campaigns — no breadcrumb needed
    const crumbs: {
        label: string;
        href: string;
    }[] = [];
    let href = "";
    for (let i = 0; i < segments.length; i++) {
        href += "/" + segments[i];
        const seg = segments[i];
        // Skip UUIDs for display (show "Edit" instead)
        const isId = seg.length > 20 || /^[0-9a-f-]{20,}$/i.test(seg);
        // Use parent segment to determine label for ID segments
        const parent = segments[i - 1] || "";
        const ID_LABELS: Record<string, string> = {
            campaigns: "Edit Campaign", posts: "Edit Post", pages: "Edit Page",
            donors: "Donor Profile", users: "User", invoices: "Invoice",
        };
        const label = isId
            ? (i === segments.length - 1 ? (ID_LABELS[parent] || "Edit") : "")
            : (LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1));
        if (label)
            crumbs.push({ label, href });
    }
    return (<nav className="flex items-center gap-1.5 text-xs text-muted px-6 pt-4 pb-0">
      {crumbs.map((c, i) => (<span key={c.href} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted/40 text-xs select-none">›</span>}
          {i < crumbs.length - 1 ? (<Link href={c.href} className="hover:text-brand transition">{c.label}</Link>) : (<span className="text-ink font-semibold">{c.label}</span>)}
        </span>))}
    </nav>);
}
