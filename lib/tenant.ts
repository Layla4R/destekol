export type SiteId = "destekol";
export const SITE = { id: "destekol" as const, name: "Destekol", schema: "destekol", url: "https://destekol.org" };
export const SITES = { destekol: SITE };
export function siteForHost(_host: string, _previewSite?: string) { return SITE; }
export function isSiteSession(payload: Record<string, unknown>, site: SiteId) { return payload.site === site; }
