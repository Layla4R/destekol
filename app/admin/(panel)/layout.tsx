import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { ToastProvider } from "@/components/admin/Toast";
import { getAdminSession } from "@/lib/auth";
import { getRequestSite } from "@/lib/request-site";
import { redirect } from "next/navigation";
import { headers } from 'next/headers';
import { adminLanding } from '@/lib/admin-policy';
import { requirePagePermission } from '@/lib/admin-access';
export default async function AdminPanelLayout({ children }: {
    children: React.ReactNode;
}) {
    const session = await getAdminSession();
    const allowedRoles = ["ADMIN", "EDITOR", "VIEWER", "FINANCE", "COMPLAINTS"];
    if (!session || !allowedRoles.includes(session.role))
        redirect("/admin/login");
    const path = headers().get('x-admin-path') || '/admin';
    if ((path === '/admin' || path === '/admin/') && (session.role !== 'ADMIN' || session.isStaff)) redirect(adminLanding(session));
    try { await requirePagePermission(path); } catch { redirect('/admin/forbidden'); }
    return (<ToastProvider>
      <div className="flex h-screen overflow-hidden bg-dashbg">
        <AdminSidebar access={{ role: session.role, isStaff: session.isStaff, permissions: session.permissions }}/>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-2 text-sm" dir="ltr">{getRequestSite().name} · Admin</div>
          <AdminTopbar />
          <Breadcrumb />
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>);
}
