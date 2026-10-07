/**
 * Permission system for admin staff members.
 * Only the owner (role=ADMIN, isStaff=false) has full access
 * Staff members have granular permissions from this list.
 */
export const ALL_PERMISSIONS = [
    // Content
    { id: "pages.view", label: "View Pages", group: "Content" },
    { id: "pages.edit", label: "Edit Pages", group: "Content" },
    { id: "pages.create", label: "Create Pages", group: "Content" },
    { id: "pages.delete", label: "Delete Pages", group: "Content" },
    { id: "campaigns.export", label: "Export Campaigns", group: "Content" },
    { id: "campaigns.view", label: "View Campaigns", group: "Content" },
    { id: "campaigns.edit", label: "Edit Campaigns", group: "Content" },
    { id: "campaigns.create", label: "Create Campaigns", group: "Content" },
    { id: "campaigns.delete", label: "Delete Campaigns", group: "Content" },
    { id: "posts.view", label: "View Blog Posts", group: "Content" },
    { id: "posts.edit", label: "Edit Blog Posts", group: "Content" },
    { id: "posts.create", label: "Create Blog Posts", group: "Content" },
    { id: "posts.delete", label: "Delete Blog Posts", group: "Content" },
    { id: "media.upload", label: "Upload Media", group: "Content" },
    { id: "translations.view", label: "View Translations", group: "Content" },
    { id: "translations.edit", label: "Edit Translations", group: "Content" },
    // Finance
    { id: "donations.view", label: "View Donations", group: "Finance" },
    { id: "donations.export", label: "Export Donations CSV", group: "Finance" },
    { id: "donations.refund", label: "Process Refunds", group: "Finance" },
    { id: "reports.view", label: "View Financial Reports", group: "Finance" },
    // Users & CRM
    { id: "users.view", label: "View Donors", group: "Users" },
    { id: "users.export", label: "Export Donors", group: "Users" },
    { id: "subscribers.view", label: "View Subscribers", group: "Users" },
    { id: "subscribers.export", label: "Export Subscribers", group: "Users" },
    { id: "subscribers.delete", label: "Delete Subscribers", group: "Users" },
    { id: "messages.view", label: "View General Messages", group: "Complaints" },
    { id: "messages.sensitive.view", label: "Access Sensitive Complaints", group: "Complaints" },
    { id: "messages.edit", label: "Update Messages", group: "Complaints" },
    { id: "messages.delete", label: "Delete Messages", group: "Complaints" },
    { id: "audit.view", label: "View Audit Log", group: "Admin" },
    // Admin
    { id: "staff.invite", label: "Invite Staff Members", group: "Admin" },
    { id: "staff.manage", label: "Manage Staff Roles", group: "Admin" },
    { id: "settings.view", label: "View Settings", group: "Admin" },
    { id: "settings.edit", label: "Edit Settings", group: "Admin" },
    { id: "emails.view", label: "View Email Templates", group: "Admin" },
    { id: "emails.edit", label: "Edit Email Templates", group: "Admin" },
] as const;
export type PermissionId = typeof ALL_PERMISSIONS[number]["id"];
export const PERMISSION_GROUPS = ["Content", "Finance", "Users", "Complaints", "Admin"] as const;
export const PRESET_ROLES: Record<string, {
    label: string;
    description: string;
    permissions: PermissionId[];
}> = {
    super_admin: {
        label: "Administrative Staff",
        description: "Assigned staff permissions; owner-only actions remain restricted",
        permissions: ALL_PERMISSIONS.map(p => p.id) as PermissionId[],
    },
    editor: {
        label: "Content Editor",
        description: "Can edit pages, campaigns, and blog posts",
        permissions: ["pages.view", "pages.edit", "pages.create", "campaigns.view", "campaigns.edit", "posts.view", "posts.edit", "posts.create", "media.upload", "translations.view", "translations.edit"],
    },
    campaign_manager: {
        label: "Campaign Manager",
        description: "Create and manage campaigns, view donations",
        permissions: ["campaigns.view", "campaigns.edit", "campaigns.create", "campaigns.delete", "donations.view"],
    },
    finance_manager: {
        label: "Finance Manager",
        description: "View and export donations, process refunds",
        permissions: ["donations.view", "donations.export", "donations.refund", "reports.view", "users.view", "users.export", "subscribers.view", "subscribers.export"],
    },
    viewer: {
        label: "Read Only",
        description: "View-only access to public content",
        permissions: ["pages.view", "campaigns.view", "posts.view"],
    },
    complaints_officer: { label: "Complaints Officer", description: "Access sensitive complaints and update their read status", permissions: ["messages.view", "messages.sensitive.view", "messages.edit"] },
    custom: {
        label: "Custom",
        description: "Choose specific permissions",
        permissions: [],
    },
};
/** Check if a user has a specific permission.
 *  Only the owner (isStaff=false, role=ADMIN) has all permissions.
 */
export function hasPermission(user: {
    role: string;
    isStaff?: boolean;
    permissions?: string[];
}, perm: PermissionId): boolean {
    if (user.role === "ADMIN" && !user.isStaff)
        return true; // Legacy super admin
    if (!['ADMIN','EDITOR','VIEWER','FINANCE','COMPLAINTS'].includes(user.role)) return false;
    if (user.role === 'VIEWER' && !perm.endsWith('.view')) return false;
    return (user.permissions || []).includes(perm);
}
