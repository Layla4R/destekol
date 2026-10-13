import "server-only";
import { getSupabase } from "@/lib/supabase";
import { KIT_RESOURCES, KIT_SETTINGS_ID, parseKitResources, type KitResource } from "@/lib/kit-config";

export async function readKitSettings() {
    const { data, error } = await getSupabase().from("Page")
        .select("sections,updatedAt").eq("id", KIT_SETTINGS_ID).maybeSingle();
    if (error) throw new Error("KIT_SETTINGS_READ_FAILED");
    const section = Array.isArray(data?.sections)
        ? data.sections.find((item: { type?: string }) => item?.type === "kit_links") : undefined;
    if (data && !section) throw new Error("KIT_SETTINGS_INVALID");
    return {
        resources: section ? parseKitResources(section.props?.resources) : [...KIT_RESOURCES],
        updatedAt: data?.updatedAt as string | null || null,
    };
}

export async function readPublicKitResources(): Promise<readonly KitResource[]> {
    try { return (await readKitSettings()).resources; }
    catch { return []; }
}

export async function saveKitSettings(resources: KitResource[]) {
    const { data, error } = await getSupabase().from("Page").upsert({
        id: KIT_SETTINGS_ID, slug: "kit", title: "Digital Marketing Kit",
        isSystem: true, isPublished: false, showInMenu: false,
        sections: [{ id: "kit-links", type: "kit_links", props: { resources } }],
        updatedAt: new Date().toISOString(),
    }, { onConflict: "id" }).select("updatedAt").single();
    if (error || !data) throw new Error("KIT_SETTINGS_SAVE_FAILED");
    return { resources, updatedAt: data.updatedAt as string };
}
