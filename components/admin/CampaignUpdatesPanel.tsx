"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useState } from "react";
interface Update {
    id: string;
    title: string;
    body: string;
    createdAt: string;
}
export default function CampaignUpdatesPanel({ campaignId, updates: initial, donorCount }: {
    campaignId: string;
    updates: Update[];
    donorCount: number;
}) {
    const [updates, setUpdates] = useState(initial);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [notify, setNotify] = useState(true);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        ok: boolean;
        msg: string;
    } | null>(null);
    async function post() {
        if (!title.trim() || !body.trim())
            return;
        if (notify && donorCount > 0) {
            if (!confirm(`This will send an email notification to approximately ${donorCount} donor${donorCount !== 1 ? "s" : ""}. Continue?`))
                return;
        }
        setLoading(true);
        setStatus(null);
        const res = await adminFetch(`/api/admin/campaigns/${campaignId}/updates`, {
            method: "POST",
            body: JSON.stringify({ title, body, notifyDonors: notify }),
        });
        const d = await res.json();
        if (d.ok) {
            setUpdates([d.update, ...updates]);
            setTitle("");
            setBody("");
            const limitWarn = d.donorLimitReached ? " (⚠ 1000+ donors — not all notified)" : "";
            const msg = notify
                ? `Posted — ${d.emailsSent} notified${d.failedEmails ? `, ${d.failedEmails} failed` : ""}${limitWarn}`
                : "Update posted";
            setStatus({ ok: true, msg });
        }
        else
            setStatus({ ok: false, msg: d.error || "Error" });
        setLoading(false);
    }
    const [deletingId, setDeletingId] = useState<string | null>(null);
    async function deleteUpdate(id: string) {
        if (!confirm("Delete this update?"))
            return;
        setDeletingId(id);
        try {
            const res = await adminFetch(`/api/admin/campaigns/${campaignId}/updates/${id}`, { method: "DELETE" });
            if (res.ok) {
                setUpdates(u => u.filter(x => x.id !== id));
            }
            else {
                const d = await res.json().catch(() => ({}));
                alert(d.error || "Failed to delete update");
            }
        }
        catch {
            alert("Network error — could not delete update");
        }
        setDeletingId(null);
    }
    const inp = "w-full rounded-xl border border-line bg-dashbg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
    return (<div className="bg-white rounded-xl2 border border-line p-6">
      <h2 className="font-display font-bold text-ink mb-1 flex items-center gap-2">
        <Icon name="file-text" size={18} className="text-brand"/> Campaign Updates
      </h2>
      <p className="text-muted text-xs mb-5">Post updates to donors and visitors</p>
      <div className="space-y-3 mb-6 pb-6 border-b border-line">
        <div><label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={inp} placeholder="e.g. 500 families received aid this week"/></div>
        <div><label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} maxLength={2000} className={`${inp} resize-none`} placeholder="Describe the impact and progress… (max 2000 chars)"/>
          <p className={`text-[10px] mt-0.5 text-right ${body.length > 1800 ? "text-warning" : "text-muted"}`}>{body.length}/2000</p></div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="accent-brand w-4 h-4"/>
          <span className="text-sm text-ink/80">Email {donorCount > 0 ? <><strong>{donorCount}</strong> donor{donorCount !== 1 ? "s" : ""}</> : "donors"}</span>
        </label>
        {status && (<div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold border ${status.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}>
            <Icon name={status.ok ? "check" : "x"} size={14}/>{status.msg}
          </div>)}
        <button onClick={post} disabled={loading || !title || !body} className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm transition disabled:opacity-50">
          <Icon name="send" size={14}/>{loading ? "Posting..." : "Post Update"}
        </button>
      </div>
      <div className="space-y-3">
        {updates.length === 0
            ? <p className="text-muted text-sm text-center py-4">No updates yet.</p>
            : updates.map(u => (<div key={u.id} className="border border-line rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-ink text-sm">{u.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted">{new Date(u.createdAt).toLocaleDateString("en-GB")}</span>
                  <button onClick={() => deleteUpdate(u.id)} disabled={deletingId === u.id} className="text-muted hover:text-danger transition disabled:opacity-50" title="Delete update">
                    <Icon name="trash" size={13}/>
                  </button>
                </div>
              </div>
              <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{u.body}</p>
            </div>))}
      </div>
    </div>);
}
