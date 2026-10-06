import { AdminBrandingProvider } from "@/components/admin/AdminBranding";
import { getAdminBranding } from "@/lib/admin-branding";
import { getRequestSite } from "@/lib/request-site";
import type { Metadata } from "next";
export function generateMetadata(): Metadata {
    const site = getRequestSite();
    ;
    const brand = getAdminBranding(site.id);
    return {
        title: { absolute: `${brand.name} | Admin` },
        applicationName: brand.name,
        icons: { icon: brand.logo, shortcut: brand.logo, apple: brand.logo },
    };
}
// Admin area: no site Header/Footer, LTR English layout
export default function AdminRootLayout({ children }: {
    children: React.ReactNode;
}) {
    return (<AdminBrandingProvider siteId={getRequestSite().id}>
      <div dir="ltr" className="min-h-screen bg-dashbg font-sans">
        {children}
      </div>
    </AdminBrandingProvider>);
}
