import { SITE } from "./tenant";
export function getRequestSite() { return SITE; }
export function siteEnv(name: string): string | undefined { return process.env[name]; }
