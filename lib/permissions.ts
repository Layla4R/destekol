/**
 * Permission system for admin staff members.
 * Super Admins (role=ADMIN, isStaff=true, no specific permissions = all access)
 * Staff members have granular permissions from this list.
 */
export const ALL_PERMISSIONS = [
    // Content
    { id: "pages.view", label: "View Pages", group: "Content" },
    { id: "pages.edit", label: "Edit Pages", group: "Content" },
    { id: "campaigns.view", label: "View Campaigns", group: "Content" },
    { id: "campaigns.edit", label: "Edit Campaigns", group: "Content" },
    { id: "campaigns.create", label: "Create Campaigns", group: "Content" },
    { id: "campaigns.delete", label: "Delete Campaigns", group: "Content" },
    { id: "posts.view", label: "View Blog Posts", group: "Content" },
    { id: "posts.edit", label: "Edit Blog Posts", group: "Content" },
    // Finance
    { id: "donations.view", label: "View Donations", group: "Finance" },
    { id: "donations.export", label: "Export Donations CSV", group: "Finance" },
    { id: "donations.refund", label: "Process Refunds", group: "Finance" },
    // Users & CRM
    { id: "users.view", label: "View Donors", group: "Users" },
    { id: "subscribers.view", label: "View Subscribers", group: "Users" },
    { id: "subscribers.export", label: "Export Subscribers", group: "Users" },
    // Admin
    { id: "staff.invite", label: "Invite Staff Members", group: "Admin" },
    { id: "staff.manage", label: "Manage Staff Roles", group: "Admin" },
    { id: "settings.view", label: "View Settings", group: "Admin" },
    { id: "settings.edit", label: "Edit Settings", group: "Admin" },
] as const;
export type PermissionId = typeof ALL_PERMISSIONS[number]["id"];
export const PERMISSION_GROUPS = ["Content", "Finance", "Users", "Admin"] as const;
export const PRESET_ROLES: Record<string, {
    label: string;
    description: string;
    permissions: PermissionId[];
}> = {
    super_admin: {
        label: "Super Admin",
        description: "Full access to everything",
        permissions: ALL_PERMISSIONS.map(p => p.id) as PermissionId[],
    },
    editor: {
        label: "Content Editor",
        description: "Can edit pages, campaigns, and blog posts",
        permissions: ["pages.view", "pages.edit", "campaigns.view", "campaigns.edit", "posts.view", "posts.edit"],
    },
    campaign_manager: {
        label: "Campaign Manager",
        description: "Create and manage campaigns, view donations",
        permissions: ["campaigns.view", "campaigns.edit", "campaigns.create", "campaigns.delete", "donations.view"],
    },
    finance_manager: {
        label: "Finance Manager",
        description: "View and export donations, process refunds",
        permissions: ["donations.view", "donations.export", "donations.refund", "subscribers.view", "subscribers.export"],
    },
    viewer: {
        label: "Read Only",
        description: "View-only access to all sections",
        permissions: ["pages.view", "campaigns.view", "posts.view", "donations.view", "users.view", "subscribers.view", "settings.view"],
    },
    custom: {
        label: "Custom",
        description: "Choose specific permissions",
        permissions: [],
    },
};
/** Check if a user has a specific permission.
 *  Super admins (isStaff=false with role=ADMIN or empty permissions array with isStaff=true) have all permissions.
 */
export function hasPermission(user: {
    role: string;
    isStaff?: boolean;
    permissions?: string[];
}, perm: PermissionId): boolean {
    if (user.role === "ADMIN" && !user.isStaff)
        return true; // Legacy super admin
    if (user.isStaff && (!user.permissions || user.permissions.length === 0))
        return true; // Staff with all perms
    return (user.permissions || []).includes(perm);
}
