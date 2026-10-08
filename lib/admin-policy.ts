import { hasPermission, type PermissionId } from './permissions';
export type AccessPolicy = { permission: PermissionId; ownerOnly?: boolean };
export function adminApiPolicy(path: string, method = 'GET'): AccessPolicy | null {
    const read = method === 'GET' || method === 'HEAD';
    if (/^\/api\/admin\/auth\/(me|logout)$/.test(path)) return null;
    if (path.startsWith('/api/admin/invites') || path.startsWith('/api/admin/users')) return { permission: 'staff.manage', ownerOnly: true };
    if (path.startsWith('/api/admin/campaigns/export')) return { permission: 'campaigns.export' };
    if (path.startsWith('/api/admin/campaigns')) return { permission: read ? 'campaigns.view' : method === 'DELETE' ? 'campaigns.delete' : path === '/api/admin/campaigns' && method === 'POST' ? 'campaigns.create' : 'campaigns.edit' };
    if (path.startsWith('/api/admin/pages')) return { permission: read ? 'pages.view' : method === 'DELETE' ? 'pages.delete' : path === '/api/admin/pages' && method === 'POST' ? 'pages.create' : 'pages.edit' };
    if (path.startsWith('/api/admin/posts') || path.startsWith('/api/admin/news')) return { permission: read ? 'posts.view' : method === 'DELETE' ? 'posts.delete' : method === 'POST' && path === '/api/admin/posts' ? 'posts.create' : 'posts.edit' };
    if (path.startsWith('/api/admin/paytr-settings')) return { permission: read ? 'settings.view' : 'settings.edit', ownerOnly:true };
    if (/^\/api\/admin\/donations\/[^/]+\/refund$/.test(path)) return {permission:'donations.refund'};
    if (path.startsWith('/api/admin/settings/test-smtp')) return { permission: 'settings.edit' };
    if (path.startsWith('/api/admin/settings')) return { permission: read ? 'settings.view' : 'settings.edit' };
    if (path.startsWith('/api/admin/email-templates')) return { permission: read ? 'emails.view' : 'emails.edit' };
    if (path.startsWith('/api/admin/translations') || path === '/api/admin/translate') return { permission: read ? 'translations.view' : 'translations.edit' };
    if (path === '/api/admin/upload') return { permission: 'media.upload' };
    if (path.startsWith('/api/admin/reports')) return { permission: 'reports.view' };
    return null;
}
export function adminPagePolicy(path: string): AccessPolicy | null {
    if (path === '/admin/forbidden') return null;
    if (path === '/admin' || path === '/admin/') return { permission: 'audit.view', ownerOnly: true };
    const section = path.split('/')[2];
    const rules: Record<string, AccessPolicy> = {
        pages: { permission: 'pages.view' }, campaigns: { permission: 'campaigns.view' }, posts: { permission: 'posts.view' },
        messages: { permission: 'messages.view' }, donations: { permission: 'donations.view' }, invoices: { permission: 'donations.view' },
        subscribers: { permission: 'subscribers.view' }, donors: { permission: 'users.view' }, reports: { permission: 'reports.view' },
        staff: { permission: 'staff.manage', ownerOnly: true }, users: { permission: 'staff.manage', ownerOnly: true }, audit: { permission: 'audit.view' },
        translations: { permission: 'translations.view' }, appearance: { permission: 'settings.view' }, emails: { permission: 'emails.view' }, settings: { permission: 'settings.view' },
    };
    const rule = rules[section];
    if (['pages','campaigns','posts'].includes(section) && path.split('/').filter(Boolean).length > 2 && !path.includes('/new')) return { permission: `${section}.edit` as PermissionId };
    if (rule && /\/(new|edit)(\/|$)/.test(path)) {
        const editPermissions: Record<string, PermissionId> = { pages: path.includes('/new') ? 'pages.create' : 'pages.edit', campaigns: path.includes('/new') ? 'campaigns.create' : 'campaigns.edit', posts: path.includes('/new') ? 'posts.create' : 'posts.edit' };
        if (editPermissions[section]) return { permission: editPermissions[section] };
    }
    return rule || null;
}
export function policyAllows(user: { role: string; isStaff?: boolean; permissions?: string[] }, policy: AccessPolicy | null) {
    return !!policy && (!policy.ownerOnly || (user.role === 'ADMIN' && !user.isStaff)) && hasPermission(user, policy.permission);
}
export function adminLanding(user: { role: string; isStaff?: boolean; permissions?: string[] }) {
    return ['/admin','/admin/messages','/admin/donations','/admin/pages','/admin/campaigns','/admin/posts','/admin/subscribers','/admin/reports'].find(path => policyAllows(user, adminPagePolicy(path))) || '/admin/forbidden';
}
