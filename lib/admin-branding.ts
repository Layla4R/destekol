import { SITES,type SiteId } from "./tenant";
export function getAdminBranding(siteId: SiteId) {
    return {
        name: SITES[siteId].name,
        logo: "/brand/destekol-logo.png",
    };
}
