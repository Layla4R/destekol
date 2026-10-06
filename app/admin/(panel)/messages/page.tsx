import Icon from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import MarkAllReadButton from "./MarkAllReadButton";
import MessageActions from "./MessageActions";
export const revalidate = 0;
export default async function MessagesPage({ searchParams }: {
    searchParams: {
        page?: string;
        unread?: string;
        sort?: string;
    };
}) {
    try {
        await requireAdmin();
    }
    catch {
        redirect("/admin/login");
    }
    const supabase = getSupabase();
    const page = Math.max(1, parseInt(searchParams?.page || "1"));
    const PAGE_SIZE = 30;
    const from = (page - 1) * PAGE_SIZE;
    const unreadOnly = searchParams?.unread === "1";
    const sort = (searchParams?.sort === "oldest") ? "oldest" : "newest";
    let query = supabase
        .from("ContactMessage")
        .select("*", { count: "exact" })
        .order("createdAt", { ascending: sort === "oldest" });
    if (unreadOnly)
        query = query.eq("isRead", false);
    const { data: messages, count } = await query.range(from, from + PAGE_SIZE - 1);
    // Separate count query — needed because main query may be filtered/paginated
    const { count: unreadCount } = await supabase.from("ContactMessage").select("*", { count: "exact", head: true }).eq("isRead", false);
    const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
    return (<div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1 flex items-center gap-3">
            Contact Messages
            {(unreadCount || 0) > 0 && (<span className="bg-danger text-white text-xs font-bold rounded-full px-2.5 py-1">{unreadCount} new</span>)}
          </h1>
          <p className="text-muted text-sm">{count ?? 0} total · {unreadCount ?? 0} unread</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`?${sort !== "newest" ? `sort=${sort}&` : ""}`} className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${!unreadOnly ? "bg-brand text-white border-brand" : "border-line text-muted hover:border-brand"}`}>All</a>
          <a href={`?unread=1${sort !== "newest" ? `&sort=${sort}` : ""}`} className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${unreadOnly ? "bg-brand text-white border-brand" : "border-line text-muted hover:border-brand"}`}>Unread</a>
          <a href={`?${unreadOnly ? "unread=1&" : ""}${sort === "oldest" ? "" : "sort=oldest"}`} className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${sort === "oldest" ? "bg-ink text-white border-ink" : "border-line text-muted hover:border-brand"}`}>{sort === "oldest" ? "↑ Oldest" : "↓ Newest"}</a>
          {(unreadCount || 0) > 0 && <MarkAllReadButton />}
        </div>
      </div>

      {!messages?.length ? (<div className="bg-white rounded-2xl border border-line p-16 text-center">
          <Icon name="mail" size={40} className="text-line mx-auto mb-4"/>
          <p className="text-muted">{unreadOnly ? "No unread messages." : "No messages yet."}</p>
        </div>) : (<div className="space-y-3">
          {messages.map((m: any) => (<div key={m.id} className={`bg-white rounded-2xl border p-5 transition ${!m.isRead ? "border-brand/30 shadow-sm" : "border-line"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${!m.isRead ? "bg-brand text-white" : "bg-dashbg text-muted"}`}>
                    {(m.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-ink">{m.name}</span>
                      {!m.isRead && <span className="text-[10px] bg-brand text-white rounded-full px-2 py-0.5 font-bold">NEW</span>}
                    </div>
                    <a href={`mailto:${m.email}`} className="text-sm text-brand hover:underline">{m.email}</a>
                    {m.subject && <p className="text-sm font-semibold text-ink mt-1">{m.subject}</p>}
                    <p className="text-sm text-muted mt-2 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-muted whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(m.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <MessageActions id={m.id} isRead={m.isRead} email={m.email}/>
                </div>
              </div>
            </div>))}
        </div>)}

      {totalPages > 1 && (<div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted">{count} messages</p>
          <div className="flex gap-2">
            {page > 1 && <a href={`?page=${page - 1}${unreadOnly ? "&unread=1" : ""}`} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand transition">← Prev</a>}
            <span className="px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
            {page < totalPages && <a href={`?page=${page + 1}${unreadOnly ? "&unread=1" : ""}`} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand transition">Next →</a>}
          </div>
        </div>)}
    </div>);
}
