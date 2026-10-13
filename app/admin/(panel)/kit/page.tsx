import KitLinksEditor from "@/components/admin/KitLinksEditor";
import { getAdminSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function AdminKitPage() {
    const session = await getAdminSession();
    return <KitLinksEditor canEdit={Boolean(session && hasPermission(session, "pages.edit"))} />;
}
