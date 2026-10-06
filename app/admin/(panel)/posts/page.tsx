"use client";
import NewsCategoriesManager from "@/components/admin/NewsCategoriesManager";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { type NewsCategory,newsCategoryLabel } from "@/lib/news-categories";
import Link from "next/link";
import React,{ useEffect,useState } from "react";
interface Post {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverImage?: string;
    isPublished: boolean;
    publishedAt: string;
    categorySlug?: string | null;
}
export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [categoryFilter, setCategoryFilter] = useState("");
    const [savingCategory, setSavingCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [serverSearch, setServerSearch] = useState("");
    const PAGE_SIZE = 50;
    const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout>>();
    async function load(p = page, st = statusFilter, q = serverSearch) {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(p) });
            if (st)
                params.set("status", st);
            if (q)
                params.set("q", q);
            if (categoryFilter)
                params.set("category", categoryFilter);
            const res = await adminFetch(`/api/admin/posts?${params}`);
            if (!res.ok) {
                setError("Failed to load posts");
                setLoading(false);
                return;
            }
            const d = await res.json();
            setPosts(d.posts || []);
            setCategories(d.categories || []);
            setTotalCount(d.count || 0);
        }
        catch {
            setError("Network error — could not load posts.");
        }
        setLoading(false);
    }
    async function togglePublish(id: string, current: boolean) {
        setPosts(p => p.map(x => x.id === id ? { ...x, isPublished: !current } : x));
        try {
            const res = await adminFetch(`/api/admin/posts/${id}`, {
                method: "PATCH", body: JSON.stringify({ isPublished: !current }),
            });
            if (!res.ok)
                throw new Error();
        }
        catch {
            setPosts(p => p.map(x => x.id === id ? { ...x, isPublished: current } : x));
        }
    }
    async function bulkDelete() {
        if (!selected.size)
            return;
        if (!confirm(`Delete ${selected.size} post(s)?`))
            return;
        setBulkLoading(true);
        const ids = [...selected];
        const results = await Promise.allSettled(ids.map(id => adminFetch(`/api/admin/posts/${id}`, { method: "DELETE" }).then(r => { if (!r.ok)
            throw new Error(id); return id; })));
        const deleted = results.filter(r => r.status === "fulfilled").map(r => (r as any).value as string);
        setPosts(p => p.filter(x => !deleted.includes(x.id)));
        setTotalCount(c => c - deleted.length);
        setSelected(new Set());
        setBulkLoading(false);
    }
    async function remove(id: string) {
        if (!confirm("Delete this post?"))
            return;
        try {
            const res = await adminFetch(`/api/admin/posts/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                alert(d.error || "Failed to delete");
                return;
            }
            setPosts(p => p.filter(x => x.id !== id));
            setTotalCount(c => c - 1);
        }
        catch {
            alert("Network error — could not delete post.");
        }
    }
    useEffect(() => { load(page, statusFilter, serverSearch); }, [page, statusFilter, serverSearch, categoryFilter]);
    async function changeCategory(id: string, categorySlug: string) {
        setSavingCategory(id);
        setError("");
        try {
            const response = await adminFetch(`/api/admin/posts/${id}`, { method: "PATCH", body: JSON.stringify({ categorySlug: categorySlug || null }) });
            const result = await response.json();
            if (!response.ok)
                throw new Error(result.error || "Could not save category");
            await load();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Could not save category");
        }
        finally {
            setSavingCategory(null);
        }
    }
    // Show immediate client-side filter while server search is pending
    const filtered = search
        ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.slug.toLowerCase().includes(search.toLowerCase()))
        : posts;
    return (<div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">News & Blog</h1>
          <p className="text-muted text-sm">Manage your news posts and blog articles</p>
        </div>
        <div className="flex items-center gap-3">
          {categories.length > 0 && <select aria-label="Filter news category" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="border border-line rounded-xl px-3 py-2.5 text-sm bg-white">
            <option value="">All categories / كل التصنيفات</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{newsCategoryLabel(c, "ar")}</option>)}
          </select>}
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"/>
            <input type="search" placeholder="Search posts…" value={search} onChange={e => {
            setSearch(e.target.value);
            clearTimeout(searchDebounceRef.current);
            const val = e.target.value;
            if (!val) {
                setServerSearch("");
                setPage(1);
            } // Immediate clear
            else {
                searchDebounceRef.current = setTimeout(() => { setServerSearch(val); setPage(1); }, 400);
            }
        }} className="pl-8 pr-4 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 w-48 bg-white"/>
          </div>
          <div className="flex gap-1.5">
            {[["", "All"], ["published", "Published"], ["draft", "Drafts"]].map(([v, l]) => (<button key={v} onClick={() => { setStatusFilter(v); setPage(1); }} className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${statusFilter === v ? "bg-brand text-white border-brand" : "border-line text-muted hover:border-brand bg-white"}`}>
                {l}
              </button>))}
          </div>
          <Link href="/admin/posts/new" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm transition">
            <Icon name="plus" size={16}/> New Post
          </Link>
        </div>
      </div>

      {categories.length > 0 && <NewsCategoriesManager categories={categories} onSaved={() => { void load(); }}/>}
      {selected.size > 0 && (<div className="flex items-center gap-3 mb-4 px-4 py-3 bg-brand/5 border border-brand/20 rounded-xl">
          <span className="text-sm font-semibold text-brand">{selected.size} selected</span>
          <div className="flex gap-2 ms-auto">
            <button onClick={bulkDelete} disabled={bulkLoading} className="text-xs font-bold bg-danger/10 text-danger border border-danger/20 rounded-lg px-3 py-1.5 transition">
              Delete Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-muted hover:text-ink transition">Cancel</button>
          </div>
        </div>)}
      {error && (<div className="bg-danger/8 border border-danger/20 rounded-xl p-4 mb-4 flex items-center gap-3">
          <Icon name="x" size={16} className="text-danger"/>
          <span className="text-danger text-sm">{error}</span>
          <button onClick={() => load()} className="ml-auto text-xs font-bold text-danger underline">Retry</button>
        </div>)}
      {loading ? (<div className="bg-white rounded-2xl border border-line p-16 text-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-muted text-sm">Loading posts…</p>
        </div>) : (<div className="bg-white rounded-xl2 border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dashbg border-b border-line text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-8"><input type="checkbox" className="rounded" checked={filtered.length > 0 && filtered.every(p => selected.has(p.id))} onChange={e => setSelected(e.target.checked ? new Set(filtered.map(p => p.id)) : new Set())}/></th>
                <th className="text-left py-3 px-4">Title</th>
                <th className="text-left py-3 px-4">Slug</th>
                {categories.length > 0 && <th className="text-left py-3 px-4">Category / التصنيف</th>}
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Published</th>
                <th className="py-3 px-4"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => (<tr key={p.id} className="hover:bg-dashbg/50 transition">
                  <td className="py-3 px-3"><input type="checkbox" className="rounded" checked={selected.has(p.id)} onChange={() => setSelected(s => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}/></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {(p as any).coverImage ? (<img src={(p as any).coverImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-line"/>) : (<div className="w-10 h-10 rounded-lg bg-dashbg border border-line flex items-center justify-center shrink-0">
                          <Icon name="image" size={14} className="text-muted"/>
                        </div>)}
                      <span className="font-medium text-ink truncate max-w-xs">{p.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted font-mono text-xs">{p.slug}</td>
                  {categories.length > 0 && <td className="py-3 px-4"><select aria-label={`Category: ${p.title}`} value={p.categorySlug || ""} disabled={savingCategory !== null} onChange={e => changeCategory(p.id, e.target.value)} className="border border-line rounded-lg p-2 text-xs bg-white max-w-44">
                    <option value="">غير مصنف / Uncategorized</option>
                    {categories.map(c => <option key={c.slug} value={c.slug}>{newsCategoryLabel(c, "ar")}</option>)}
                  </select></td>}
                  <td className="py-3 px-4">
                    <button onClick={() => togglePublish(p.id, p.isPublished)} className={`text-xs font-bold rounded-full px-2.5 py-1 transition ${p.isPublished ? "bg-success/10 text-success hover:bg-success/20" : "bg-muted/10 text-muted hover:bg-muted/20"}`}>
                      {p.isPublished ? "✓ Published" : "Draft"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-muted text-xs">{new Date(p.publishedAt).toLocaleDateString("en-GB")}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/posts/${p.id}`} className="text-brand hover:underline text-xs font-semibold mr-3">Edit</Link>
                    <button onClick={() => remove(p.id)} className="text-danger hover:text-danger/70">
                      <Icon name="trash" size={14}/>
                    </button>
                  </td>
                </tr>))}
              {filtered.length === 0 && (<tr><td colSpan={categories.length ? 7 : 6} className="py-12 text-center text-muted">
                  {search ? `No posts match "${search}"` : "No posts yet. Create your first news article."}
                </td></tr>)}
            </tbody>
          </table>
        </div>)}
      {totalCount > PAGE_SIZE && (<div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} posts
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand disabled:opacity-30 transition">← Prev</button>
            <span className="px-4 py-2 text-sm text-muted">Page {page} of {Math.ceil(totalCount / PAGE_SIZE)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= totalCount} className="px-4 py-2 border border-line rounded-xl text-sm hover:border-brand hover:text-brand disabled:opacity-30 transition">Next →</button>
          </div>
        </div>)}
    </div>);
}
