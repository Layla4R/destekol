import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { hasPermission, type PermissionId } from '@/lib/permissions';
export default async function ForbiddenPage() {
    const session = await getAdminSession();
    const sections: { label: string; href: string; permission: PermissionId }[] = [
        { label: 'Messages', href: '/admin/messages', permission: 'messages.view' },
        { label: 'Campaigns', href: '/admin/campaigns', permission: 'campaigns.view' },
        { label: 'Pages', href: '/admin/pages', permission: 'pages.view' },
        { label: 'Donations', href: '/admin/donations', permission: 'donations.view' },
        { label: 'Staff permissions', href: '/admin/staff', permission: 'staff.manage' },
    ];
    return <div className="p-8"><h1 className="text-xl font-bold">Access denied / الوصول غير مسموح</h1><p className="mt-3 text-muted">Your account does not have permission for this action. Contact the administrator.</p><div className="mt-5 flex flex-wrap gap-5">{session && sections.filter(section => hasPermission(session, section.permission)).map(section => <Link key={section.href} className="text-brand" href={section.href}>{section.label}</Link>)}</div></div>;
}
