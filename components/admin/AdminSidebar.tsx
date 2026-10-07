"use client";
import Icon,{ IconName } from "@/components/icons";
import { adminFetch,clearAdminToken } from "@/lib/admin-fetch";
import Image from "next/image";
import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { useAdminBranding } from "./AdminBranding";
import { adminPagePolicy, policyAllows } from '@/lib/admin-policy';
const NAV: {
    href: string;
    label: string;
    icon: IconName;
    group?: string;
}[] = [
    { href: "/admin", label: "Dashboard", icon: "bar-chart" },
    // Content
    { href: "/admin/pages", label: "Pages", icon: "layers", group: "Content" },
    { href: "/admin/campaigns", label: "Campaigns", icon: "hand-heart", group: "Content" },
    { href: "/admin/posts", label: "News & Blog", icon: "book-open", group: "Content" },
    // Operations
    { href: "/admin/messages", label: "Messages", icon: "help-circle", group: "Operations" },
    { href: "/admin/donations", label: "Donations", icon: "wallet", group: "Operations" },
    { href: "/admin/invoices", label: "Invoices", icon: "file-text", group: "Operations" },
    { href: "/admin/subscribers", label: "Subscribers", icon: "message-circle", group: "Operations" },
    { href: "/admin/donors", label: "Donors", icon: "heart", group: "Operations" },
    { href: "/admin/reports", label: "Reports", icon: "target", group: "Operations" },
    // Admin
    { href: "/admin/staff", label: "Staff & Roles", icon: "shield-check", group: "Admin" },
    { href: "/admin/audit", label: "Access & Activity Log", icon: "list-checks", group: "Admin" },
    { href: "/admin/staff#invite", label: "Invite Staff", icon: "plus", group: "Admin" },
    { href: "/admin/users", label: "All Users", icon: "eye", group: "Admin" },
    { href: "/admin/translations", label: "Translations", icon: "globe", group: "Admin" },
    { href: "/admin/appearance", label: "Appearance", icon: "image", group: "Admin" },
    { href: "/admin/emails", label: "Email Templates", icon: "send", group: "Admin" },
    { href: "/admin/settings", label: "Settings", icon: "settings", group: "Admin" },
];
export default function AdminSidebar({ access }: { access: { role: string; isStaff: boolean; permissions: string[] } }) {
    const brand = useAdminBranding();
    const pathname = usePathname();
    const router = useRouter();
    async function logout() {
        clearAdminToken();
        await adminFetch("/api/admin/auth/logout", { method: "POST" });
        router.push("/admin/login");
    }
    const groups = ["", "Content", "Operations", "Admin"];
    return (
    // 🌟 تم تعديل min-h-screen إلى h-screen ليتوافق مع الغلاف الخارجي
    <aside className="w-60 bg-sidebar-gradient text-white h-screen flex flex-col shrink-0 border-r border-white/5">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Image src={brand.logo} alt={brand.name} width={180} height={72} className={`h-9 mb-1.5 ${brand.name === "Destekol" ? "w-44 object-cover" : "w-auto object-contain"}`}/>
        <div className="text-white/80 text-xs font-semibold tracking-widest uppercase">Admin Panel</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#475569_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-white/30">
        {groups.map((group) => {
            const items = NAV.filter((n) => (n.group || "") === group && policyAllows(access, adminPagePolicy(n.href.split('#')[0])));
            if (!items.length)
                return null;
            return (<div key={group} className="mb-4">
              {group && (<div className="text-white/30 text-xs font-bold tracking-widest uppercase px-3 mb-1.5">{group}</div>)}
              <div className="space-y-0.5">
                {items.map((item) => {
                    const hrefBase = item.href.split("#")[0];
                    const active = item.href === "/admin"
                        ? pathname === "/admin"
                        : item.href.includes("#")
                            ? false
                            : pathname === hrefBase || pathname?.startsWith(hrefBase + "/") || pathname?.startsWith(hrefBase + "?");
                    return (<Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition border-l-2 ${active
                            ? "bg-white/12 font-semibold text-white border-brand-light"
                            : "text-white/80 hover:bg-white/6 hover:text-white border-transparent"}`}>
                      <Icon name={item.icon} size={16} className={active ? "text-brand-light" : ""}/>
                      {item.label}
                    </Link>);
                })}
              </div>
            </div>);
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10 space-y-0.5">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 hover:bg-white/6 hover:text-white transition">
          <Icon name="globe" size={16}/> View Site
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 hover:bg-white/6 hover:text-white transition">
          <Icon name="log-out" size={16}/> Sign Out
        </button>
      </div>
    </aside>);
}
