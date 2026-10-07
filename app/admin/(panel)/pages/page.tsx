"use client";
import { useToast } from "@/components/admin/Toast";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import Link from "next/link";
import { useRouter,useSearchParams } from "next/navigation";
import { useCallback,useEffect,useRef,useState } from "react";
interface Page {
    id: string;
    slug: string;
    title: string;
    description?: string;
    isPublished: boolean;
    showInMenu: boolean;
    isSystem: boolean;
    order: number;
    sectionsCount?: number;
}
type TransMap = Record<string, Record<string, boolean>>;
const LOCALES = [
    { code: "ar", flag: "🇸🇦", label: "Arabic (Base)" },
    { code: "en", flag: "🇬🇧", label: "English" },
    { code: "fr", flag: "🇫🇷", label: "Français" },
    { code: "tr", flag: "🇹🇷", label: "Türkçe" },
];
const LEGAL_SLUGS = ["privacy", "terms", "refund-policy", "cookie-policy", "aml-policy", "complaints", "license", "financial-transparency", "how-we-use-donations", "kvkk"];
export default function AdminPagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // قراءة اللغة من الرابط إن وجدت، وإلا اعتماد اللغة العربية افتراضياً
    const initialLang = searchParams.get("lang") || searchParams.get("locale") || "ar";
    const [pages, setPages] = useState<Page[]>([]);
    const [transMap, setTransMap] = useState<TransMap>({});
    const [loading, setLoading] = useState(true);
    const [activeLocale, setActiveLocale] = useState(initialLang);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [showNewModal, setShowNewModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newSlug, setNewSlug] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const dragItem = useRef<Page | null>(null);
    const [loadError, setLoadError] = useState<string>("");
    const { toast } = useToast();
    // تحديث الـ URL عند تغيير تبويب اللغة
    const handleLocaleChange = (code: string) => {
        setActiveLocale(code);
        setSelected(new Set());
        router.replace(`/admin/pages?lang=${code}`, { scroll: false });
    };
    const load = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const res = await adminFetch("/api/admin/pages");
            const d = await res.json();
            if (!res.ok) {
                setLoadError(d.error || "Failed to load pages.");
                setLoading(false);
                return;
            }
            setPages(d.pages || []);
            setTransMap(d.transMap || {});
        }
        catch {
            setLoadError("Network error — could not load pages.");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = pages.filter(p => !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()));
    // ── Toggle ────────────────────────────────────────────────
    async function togglePublished(id: string, current: boolean) {
        setPages(p => p.map(x => x.id === id ? { ...x, isPublished: !current } : x));
        try {
            const res = await adminFetch(`/api/admin/pages/${id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublished: !current }),
            });
            if (!res.ok)
                throw new Error("Failed");
        }
        catch {
            setPages(p => p.map(x => x.id === id ? { ...x, isPublished: current } : x));
        }
    }
    async function toggleMenu(id: string, current: boolean) {
        setPages(p => p.map(x => x.id === id ? { ...x, showInMenu: !current } : x));
        try {
            const res = await adminFetch(`/api/admin/pages/${id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ showInMenu: !current }),
            });
            if (!res.ok)
                throw new Error("Failed");
        }
        catch {
            setPages(p => p.map(x => x.id === id ? { ...x, showInMenu: current } : x));
        }
    }
    async function deletePage(id: string, title: string) {
        if (!confirm(`Delete "${title}"? This cannot be undone.`))
            return;
        try {
            const res = await adminFetch(`/api/admin/pages/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                alert(d.error || "Failed to delete page. Please try again.");
                return;
            }
            setPages(p => p.filter(x => x.id !== id));
            setSelected(s => { const n = new Set(s); n.delete(id); return n; });
        }
        catch {
            toast("Network error — could not delete page.", "error");
        }
    }
    // ── Bulk ──────────────────────────────────────────────────
    const filteredSelectableIds = filtered.filter(p => !p.isSystem).map(p => p.id);
    function toggleSelect(id: string) {
        setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    function selectAll() {
        const allSelected = filteredSelectableIds.every(id => selected.has(id)) && filteredSelectableIds.length > 0;
        if (allSelected) {
            setSelected(s => { const n = new Set(s); filteredSelectableIds.forEach(id => n.delete(id)); return n; });
        }
        else {
            setSelected(s => { const n = new Set(s); filteredSelectableIds.forEach(id => n.add(id)); return n; });
        }
    }
    async function bulkPublish(publish: boolean) {
        if (!selected.size)
            return;
        setBulkLoading(true);
        const ids = [...selected];
        setPages(p => p.map(x => ids.includes(x.id) ? { ...x, isPublished: publish } : x));
        try {
            const results = await Promise.allSettled(ids.map(id => adminFetch(`/api/admin/pages/${id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublished: publish }),
            })));
            const failed = ids.filter((_, i) => results[i].status === "rejected");
            if (failed.length) {
                setPages(p => p.map(x => failed.includes(x.id) ? { ...x, isPublished: !publish } : x));
                alert(`${failed.length} page(s) failed to update.`);
            }
        }
        catch {
            setPages(p => p.map(x => ids.includes(x.id) ? { ...x, isPublished: !publish } : x));
        }
        setSelected(new Set());
        setBulkLoading(false);
    }
    async function bulkDelete() {
        if (!selected.size)
            return;
        const toDelete = pages.filter(p => selected.has(p.id) && !p.isSystem);
        if (!toDelete.length) {
            setSelected(new Set());
            return;
        }
        if (!confirm(`Delete ${toDelete.length} page(s)? This cannot be undone.`))
            return;
        setBulkLoading(true);
        try {
            const results = await Promise.allSettled(toDelete.map(p => adminFetch(`/api/admin/pages/${p.id}`, { method: "DELETE" })));
            const deletedIds = toDelete
                .filter((_, i) => results[i].status === "fulfilled")
                .map(p => p.id);
            const failedCount = toDelete.length - deletedIds.length;
            setPages(p => p.filter(x => !deletedIds.includes(x.id)));
            if (failedCount)
                alert(`${failedCount} page(s) could not be deleted.`);
        }
        catch {
            alert("Network error — could not delete pages.");
        }
        setSelected(new Set());
        setBulkLoading(false);
    }
    // ── Drag & drop reorder ─────────────
    function onDragStart(page: Page) { setDragging(page.id); dragItem.current = page; }
    function onDragOver(e: React.DragEvent, targetId: string) {
        e.preventDefault();
        if (targetId !== dragging)
            setDragOver(targetId);
    }
    async function onDrop(targetId: string) {
        if (!dragItem.current || dragItem.current.id === targetId) {
            setDragging(null);
            setDragOver(null);
            return;
        }
        const src = dragItem.current;
        const allPages = [...pages];
        const srcIdx = allPages.findIndex(p => p.id === src.id);
        const tgtIdx = allPages.findIndex(p => p.id === targetId);
        if (srcIdx === -1 || tgtIdx === -1) {
            setDragging(null);
            setDragOver(null);
            return;
        }
        allPages.splice(srcIdx, 1);
        allPages.splice(tgtIdx, 0, src);
        const reordered = allPages.map((p, i) => ({ ...p, order: i }));
        setPages(reordered);
        setDragging(null);
        setDragOver(null);
        try {
            await adminFetch("/api/admin/pages", {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orders: reordered.map(p => ({ id: p.id, order: p.order })) }),
            });
        }
        catch { }
    }
    // ── Create ────────────────────────────────────────────────
    async function createPage() {
        if (!newTitle.trim() || !newSlug.trim()) {
            setCreateError("Title and slug are required");
            return;
        }
        setCreating(true);
        setCreateError("");
        const res = await adminFetch("/api/admin/pages", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle.trim(), slug: newSlug.trim(), description: newDesc.trim() }),
        });
        const d = await res.json();
        if (!res.ok) {
            setCreateError(d.error || "Error");
            setCreating(false);
            return;
        }
        const id = d.page?.id;
        setShowNewModal(false);
        router.refresh();
        router.push(`/admin/pages/${id}`);
    }
    const locale = LOCALES.find(l => l.code === activeLocale)!;
    return (<div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">Pages</h1>
          <p className="text-muted text-sm">{pages.length} pages · Drag rows to reorder</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"/>
            <input type="search" placeholder="Search pages…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-4 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand w-48 bg-white"/>
          </div>
          <button onClick={() => { setShowNewModal(true); setCreateError(""); setNewTitle(""); setNewSlug(""); setNewDesc(""); }} className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm transition shadow-sm">
            <Icon name="plus" size={16}/> New Page
          </button>
        </div>
      </div>

      {/* Locale tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {LOCALES.map(l => (<button key={l.code} onClick={() => handleLocaleChange(l.code)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${activeLocale === l.code ? "bg-brand text-white border-brand shadow-sm" : "bg-white border-line text-muted hover:border-brand hover:text-brand"}`}>
            <span>{l.flag}</span>{l.label}
          </button>))}
      </div>

      {/* Info bar */}
      <div className={`px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-3 ${activeLocale === "ar" ? "bg-brand/5 border border-brand/20 text-brand" : "bg-dashbg border border-line text-muted"}`}>
        <span className="text-lg">{locale.flag}</span>
        {activeLocale === "ar"
            ? <span><strong>Arabic is the base language.</strong> Drag to reorder. Click badges to toggle publish/menu status.</span>
            : <span>Viewing <strong>{locale.label}</strong> translation status. Click <strong>Translate</strong> to add or edit a translation.</span>}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && activeLocale === "ar" && (<div className="flex items-center gap-3 mb-4 px-4 py-3 bg-brand/5 border border-brand/20 rounded-xl">
          <span className="text-sm font-semibold text-brand">{selected.size} selected</span>
          <div className="flex gap-2 ms-auto flex-wrap">
            <button onClick={() => bulkPublish(true)} disabled={bulkLoading} className="text-xs font-bold bg-success/10 text-success hover:bg-success/20 border border-success/20 rounded-lg px-3 py-1.5 transition">
              Publish All
            </button>
            <button onClick={() => bulkPublish(false)} disabled={bulkLoading} className="text-xs font-bold bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20 rounded-lg px-3 py-1.5 transition">
              Unpublish All
            </button>
            <button onClick={bulkDelete} disabled={bulkLoading} className="text-xs font-bold bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 rounded-lg px-3 py-1.5 transition">
              Delete Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-muted hover:text-ink transition">Cancel</button>
          </div>
        </div>)}

      {loadError && (<div className="bg-danger/5 border border-danger/20 rounded-2xl p-6 text-center mb-4">
          <p className="text-danger font-semibold mb-2">Failed to load pages</p>
          <p className="text-muted text-sm mb-4">{loadError}</p>
          <button onClick={load} className="bg-brand text-white font-bold rounded-xl px-5 py-2 text-sm">
            Retry
          </button>
        </div>)}

      {loading ? (<div className="bg-white rounded-2xl border border-line p-16 text-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-muted text-sm">Loading pages…</p>
        </div>) : !loadError && (<div className="bg-white rounded-2xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dashbg border-b border-line text-muted text-xs uppercase tracking-wider">
              <tr>
                {activeLocale === "ar" && (<th className="py-3 px-3 w-8">
                    <input type="checkbox" className="rounded" checked={filteredSelectableIds.length > 0 && filteredSelectableIds.every(id => selected.has(id))} onChange={selectAll}/>
                  </th>)}
                <th className="py-3 px-2 w-6"/>
                <th className="text-left py-3 px-3 w-8 font-mono">#</th>
                <th className="text-left py-3 px-4">Page</th>
                <th className="text-left py-3 px-4">Slug</th>
                <th className="text-left py-3 px-3">Blocks</th>
                {activeLocale !== "ar" && <th className="text-left py-3 px-4">Translation</th>}
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Menu</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((page, idx) => {
                const hasTranslation = activeLocale === "ar" ? true : !!transMap[page.id]?.[activeLocale];
                const isLegal = LEGAL_SLUGS.includes(page.slug);
                const blocksCount = page.sectionsCount ?? 0;
                const editHref = activeLocale === "ar"
                    ? `/admin/pages/${page.id}`
                    : `/admin/pages/${page.id}?locale=${activeLocale}`;
                const previewHref = page.slug === "home"
                    ? (activeLocale === "ar" ? "/" : `/${activeLocale}/`)
                    : (activeLocale === "ar" ? `/${page.slug}` : `/${activeLocale}/${page.slug}`);
                const isDraggingOver = dragOver === page.id;
                return (<tr key={page.id} draggable={activeLocale === "ar"} onDragStart={() => onDragStart(page)} onDragOver={e => onDragOver(e, page.id)} onDragLeave={() => setDragOver(null)} onDrop={() => onDrop(page.id)} onDragEnd={() => { setDragging(null); setDragOver(null); }} className={`transition group ${dragging === page.id ? "opacity-30" : ""} ${isDraggingOver ? "bg-brand/5 border-t-2 border-t-brand" : "hover:bg-dashbg/40"}`}>
                    {/* Checkbox */}
                    {activeLocale === "ar" && (<td className="py-3 px-3">
                        {!page.isSystem && (<input type="checkbox" className="rounded" checked={selected.has(page.id)} onChange={() => toggleSelect(page.id)}/>)}
                      </td>)}

                    {/* Drag handle */}
                    <td className="py-3 px-2">
                      {activeLocale === "ar" && (<Icon name="grip" size={14} className="text-muted/30 cursor-grab active:cursor-grabbing hover:text-muted transition"/>)}
                    </td>

                    {/* Index */}
                    <td className="py-3 px-3 text-muted font-mono text-xs">{idx + 1}</td>

                    {/* Title + badges + description */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-semibold text-ink truncate">{page.title}</span>
                        {page.isSystem && <span className="text-[10px] bg-muted/10 text-muted rounded-full px-2 py-0.5 font-semibold shrink-0">System</span>}
                        {isLegal && <span className="text-[10px] bg-amber-100 text-amber-600 rounded-full px-2 py-0.5 font-semibold shrink-0">Legal</span>}
                      </div>
                      {page.description && (<p className="text-xs text-muted truncate max-w-[220px]">{page.description}</p>)}
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 font-mono text-xs text-muted">/{page.slug}</td>

                    {/* Blocks count */}
                    <td className="py-3 px-3">
                      {isLegal ? (<span className="text-xs text-brand font-semibold">Built-in</span>) : (<span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${blocksCount > 0 ? "bg-brand/8 text-brand" : "bg-muted/10 text-muted"}`}>
                          <Icon name="layers" size={10}/>{blocksCount}
                        </span>)}
                    </td>

                    {/* Translation status */}
                    {activeLocale !== "ar" && (<td className="py-3 px-4">
                        {isLegal ? (<span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 bg-brand/10 text-brand">
                            <Icon name="check" size={11}/> Built-in
                          </span>) : (<span className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-1 ${hasTranslation ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                            <Icon name={hasTranslation ? "check" : "help-circle"} size={11}/>
                            {hasTranslation ? "Translated" : "Fallback"}
                          </span>)}
                      </td>)}

                    {/* Published */}
                    <td className="py-3 px-4">
                      {activeLocale === "ar" ? (<button onClick={() => togglePublished(page.id, page.isPublished)} className={`text-xs font-bold rounded-full px-2.5 py-1 transition ${page.isPublished ? "bg-success/10 text-success hover:bg-success/20" : "bg-muted/10 text-muted hover:bg-muted/20"}`}>
                          {page.isPublished ? "✓ Live" : "Draft"}
                        </button>) : (<span className={`text-xs font-semibold ${page.isPublished ? "text-success" : "text-muted"}`}>
                          {page.isPublished ? "Live" : "Draft"}
                        </span>)}
                    </td>

                    {/* Menu toggle */}
                    <td className="py-3 px-4">
                      {activeLocale === "ar" ? (<button onClick={() => toggleMenu(page.id, page.showInMenu)} className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 ${page.showInMenu ? "bg-brand" : "bg-line"}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${page.showInMenu ? "left-4" : "left-0.5"}`}/>
                        </button>) : (<span className={`text-xs ${page.showInMenu ? "text-success" : "text-muted"}`}>{page.showInMenu ? "✓" : "—"}</span>)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link href={editHref} className={`flex items-center gap-1.5 text-xs font-bold rounded-lg px-3 py-1.5 transition ${hasTranslation || activeLocale === "ar" ? "bg-brand text-white hover:bg-brand-dark" : "bg-amber-500 text-white hover:bg-amber-600"}`}>
                          <Icon name="layers" size={12}/>
                          {activeLocale === "ar" ? "Edit" : hasTranslation ? "Edit" : "Translate"}
                        </Link>
                        <a href={previewHref} target="_blank" className="flex items-center gap-1 text-xs border border-line text-muted rounded-lg px-2.5 py-1.5 hover:border-brand hover:text-brand transition" title="Preview">
                          <Icon name="globe" size={12}/>
                        </a>
                        {!page.isSystem && activeLocale === "ar" && (<button onClick={() => deletePage(page.id, page.title)} className="flex items-center gap-1 text-xs border border-line text-muted rounded-lg px-2.5 py-1.5 hover:border-danger hover:text-danger transition" title="Delete">
                            <Icon name="trash" size={12}/>
                          </button>)}
                      </div>
                    </td>
                  </tr>);
            })}

              {filtered.length === 0 && !loading && (<tr>
                  <td colSpan={activeLocale === "ar" ? 10 : 9} className="py-16 text-center text-muted">
                    <Icon name="search" size={32} className="mx-auto mb-3 text-line"/>
                    <p className="mb-1">{search ? `No pages match "${search}"` : "No pages yet"}</p>
                    {!search && (<button onClick={() => setShowNewModal(true)} className="mt-3 bg-brand text-white font-bold rounded-xl px-6 py-2.5 text-sm">
                        Create First Page
                      </button>)}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>)}

      {/* ── New Page Modal ────────────────────────────────── */}
      {showNewModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={e => { if (e.target === e.currentTarget)
            setShowNewModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-line w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-extrabold text-ink">Create New Page</h2>
              <button onClick={() => setShowNewModal(false)} className="text-muted hover:text-ink p-1 transition">
                <Icon name="x" size={20}/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">Page Title *</label>
                <input value={newTitle} onChange={e => {
                setNewTitle(e.target.value);
                const slug = e.target.value
                    .toLowerCase()
                    .replace(/[\u0600-\u06FF\s]+/g, "-")
                    .replace(/[^a-z0-9-]/g, "")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "");
                setNewSlug(slug);
            }} placeholder="e.g. Our Programs" className="w-full border border-line rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" autoFocus onKeyDown={e => e.key === "Enter" && createPage()}/>
              </div>

              <div>
                <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">
                  URL Slug * <span className="font-normal normal-case text-muted">— site.com/<em>your-slug</em></span>
                </label>
                <div className="flex items-center border border-line rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand">
                  <span className="px-3 py-3 text-muted text-sm bg-dashbg border-r border-line select-none">/</span>
                  <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="your-page-slug" className="flex-1 py-3 px-3 text-sm focus:outline-none" onKeyDown={e => e.key === "Enter" && createPage()}/>
                </div>
                <p className="text-xs text-muted mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>

              <div>
                <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">
                  SEO Description <span className="font-normal normal-case">(optional — shown in search results)</span>
                </label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief one-line description…" className="w-full border border-line rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"/>
              </div>

              {createError && (<div className="flex items-center gap-2 bg-danger/8 border border-danger/20 rounded-xl p-3 text-danger text-sm">
                  <Icon name="x" size={14}/> {createError}
                </div>)}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewModal(false)} className="flex-1 border border-line text-muted font-semibold rounded-xl py-3 hover:bg-dashbg transition text-sm">
                  Cancel
                </button>
                <button onClick={createPage} disabled={creating || !newTitle.trim() || !newSlug.trim()} className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold rounded-xl py-3 transition text-sm flex items-center justify-center gap-2">
                  {creating
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Creating…</>
                : "Create & Open Editor →"}
                </button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}
