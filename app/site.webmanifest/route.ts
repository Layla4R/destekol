import { getCmsBranding } from "@/lib/cms-branding";

export const dynamic = "force-dynamic";

export async function GET() {
    const branding = await getCmsBranding();
    return Response.json({
        name: branding.siteName || branding.logoText || "",
        short_name: branding.logoText || branding.siteName || "",
        description: branding.footerDescription || "",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#066090",
        icons: [{ src: "/brand/destekol-mark-v4.png", sizes: "256x256", type: "image/png", purpose: "any" }],
    }, {
        headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-cache" },
    });
}
