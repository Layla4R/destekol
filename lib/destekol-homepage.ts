import type { PageSection } from "@/lib/blocks";
/** Home projects use the published projects Page as the single CMS source unless an editor selects manual items. */
export function attachProjectPageItems(homeSections: PageSection[], projectSections: PageSection[]): PageSection[] {
    const projectBlock = projectSections.find((section) => section.type === "projects");
    const items = Array.isArray(projectBlock?.props?.items) ? projectBlock.props.items : [];
    return homeSections.map((section) => section.type === "projects" && section.props?.source !== "manual"
        ? { ...section, props: { ...section.props, items } }
        : section);
}
function storyKey(item: Record<string, any>, index: number) {
    const explicit = String(item.id || item.slug || "").trim();
    if (explicit)
        return explicit.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || `story-${index + 1}`;
    const video = String(item.videoUrl || "");
    const videoId = video.match(/(?:youtu\.be\/|[?&]v=|youtube\.com\/embed\/)([\w-]+)/i)?.[1];
    return videoId || `story-${index + 1}`;
}
/** Ensures the homepage blocks and per-story donation links are present in the CMS model. */
export function prepareDestekolHomeSections(sections: PageSection[] | null | undefined): PageSection[] {
    const next = Array.isArray(sections)
        ? sections.map((section) => ({
            ...section,
            props: { ...(section.props || {}) },
        }))
        : [];
    let stories = next.find((section) => section.type === "stories");
    if (!stories) {
        stories = { id: "destekol-field-story", type: "stories", props: { items: [] } };
        const kindnessIndex = next.findIndex((section) => section.type === "kindness_box");
        next.splice(kindnessIndex >= 0 ? kindnessIndex + 1 : next.length, 0, stories);
    }
    const storyProps = stories.props || (stories.props = {});
    if (!Array.isArray(storyProps.items))
        storyProps.items = [];
    storyProps.items = storyProps.items.map((source: any, index: number) => {
        const item = { ...source };
        if (!item.buttonLink) {
            const params = new URLSearchParams({ story: storyKey(item, index) });
            if (item.campaignId)
                params.set("campaign", item.campaignId);
            item.buttonLink = `/donate?${params.toString()}`;
        }
        return item;
    });
    if (!next.some((section) => section.type === "newsletter")) {
        next.push({ id: "destekol-newsletter", type: "newsletter", props: {} });
    }
    return next;
}
