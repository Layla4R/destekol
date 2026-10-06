"use client";
import { getAdminBranding } from "@/lib/admin-branding";
import type { SiteId } from "@/lib/tenant";
import { createContext,useContext } from "react";
const AdminBrandingContext = createContext(getAdminBranding("destekol"));
export function AdminBrandingProvider({ siteId, children }: {
    siteId: SiteId;
    children: React.ReactNode;
}) {
    return (<AdminBrandingContext.Provider value={getAdminBranding(siteId)}>
      {children}
    </AdminBrandingContext.Provider>);
}
export const useAdminBranding = () => useContext(AdminBrandingContext);
