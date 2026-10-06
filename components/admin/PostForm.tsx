"use client";
import MediaUpload from "@/components/admin/MediaUpload";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { type NewsCategory,newsCategoryLabel } from "@/lib/news-categories";
import { useRouter } from "next/navigation";
import { useCallback,useEffect,useRef,useState } from "react";
interface PostFormProps {
    categories?: NewsCategory[];
    initial?: {
        id?: string;
        title?: string;
        slug?: string;
        excerpt?: string;
        body?: string;
        body2?: string;
        coverImage?: string;
        secondaryImage?: string;
        videoUrl?: string;
        gallery?: string[];
        isPublished?: boolean;
        publishedAt?: string;
        categorySlug?: string | null;
    };
}
export default function PostForm({ initial = {}, categories = [] }: PostFormProps) {
    const router = useRouter();
    const isEdit = !!initial.id;
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const [form, setForm] = useState({
        categorySlug: initial.categorySlug || "",
        title: initial.title || "",
        slug: initial.slug || "",
        excerpt: initial.excerpt || "",
        body: initial.body || "",
        body2: initial.body2 || "",
        coverImage: initial.coverImage || "",
        secondaryImage: initial.secondaryImage || "",
        videoUrl: initial.videoUrl || "",
        gallery: Array.isArray(initial.gallery) ? initial.gallery : [],
        isPublished: initial.isPublished ?? false,
        publishedAt: initial.publishedAt
            ? new Date(initial.publishedAt).toISOString().slice(0, 16)
            : "",
    });
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [error, setError] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const saveRef = useRef<() => void>();
    const set = useCallback((k: string, v: any) => {
        setIsDirty(true);
        if (k === "title" && !isEdit) {
            const rawSlug = v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            const slug = rawSlug || `post-${Date.now()}`;
            setForm((f) => ({ ...f, title: v, slug }));
        }
        else {
            setForm((f) => ({ ...f, [k]: v }));
        }
    }, [isEdit]);
    useEffect(() => {
        saveRef.current = save;
    });
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        }
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveRef.current?.();
            }
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            window.removeEventListener("keydown", onKey);
        };
    }, [isDirty]);
    const addGalleryImage = (url: string) => {
        if (!url)
            return;
        set("gallery", [...form.gallery, url]);
    };
    const removeGalleryImage = (index: number) => {
        set("gallery", form.gallery.filter((_, i) => i !== index));
    };
    async function save() {
        if (!form.title || !form.slug || !form.excerpt || !form.body) {
            setError("Title, slug, excerpt and Primary Body are required");
            return;
        }
        setStatus("saving");
        setError("");
        try {
            const res = await adminFetch(isEdit ? `/api/admin/posts/${initial.id}` : "/api/admin/posts", {
                method: isEdit ? "PATCH" : "POST",
                body: JSON.stringify(form),
            });
            const d = await res.json();
            if (!res.ok)
                throw new Error(d.error || "Failed to save");
            setStatus("saved");
            setIsDirty(false);
            setTimeout(() => router.push("/admin/posts"), 1500);
        }
        catch (e: any) {
            setError(e.message);
            setStatus("error");
        }
    }
    const inp = "w-full rounded-xl border border-line bg-white py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
    if (!mounted) {
        return <div className="w-full h-96 bg-white rounded-2xl animate-pulse border border-line p-8"/>;
    }
    return (<div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          {isEdit ? "Edit News Article" : "New News Article"}
        </h1>
        <button onClick={() => router.push("/admin/posts")} className="text-muted hover:text-ink text-sm font-semibold flex items-center gap-1.5 border border-line rounded-xl px-4 py-2 bg-white transition">
          <Icon name="arrow-left" size={16}/> Back
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 space-y-6 shadow-sm w-full">
        {/* Title & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Title *</div>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inp} placeholder="Article title"/>
          </div>
          <div>
            <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Slug *</div>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inp} placeholder="article-url-slug"/>
          </div>
        </div>

        {/* 1. Cover Image */}
        {categories.length > 0 && <div>
          <label htmlFor="news-category" className="block text-xs text-muted font-bold mb-2">Category / التصنيف</label>
          <select id="news-category" value={form.categorySlug} onChange={e => set("categorySlug", e.target.value)} className={inp}>
            <option value="">Uncategorized / غير مصنف</option>
            {categories.map(category => <option key={category.slug} value={category.slug}>{newsCategoryLabel(category, "ar")} — {newsCategoryLabel(category, "en")}</option>)}
          </select>
        </div>}
        <MediaUpload value={form.coverImage} onChange={(v) => set("coverImage", v)} label="1. Main Cover Image (Top Banner)" type="image"/>

        {/* Excerpt */}
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">
            Excerpt / Summary * <span className="text-muted font-normal normal-case">(Highlighted lead text)</span>
          </div>
          <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={`${inp} h-20 resize-none`} placeholder="Short summary..."/>
        </div>

        {/* 2. Primary Body */}
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">
            2. First Paragraph / Body * <span className="text-muted font-normal normal-case">(Supports HTML)</span>
          </div>
          <textarea value={form.body} onChange={(e) => set("body", e.target.value)} className={`${inp} h-52 resize-y font-mono text-xs`} placeholder="First section of article content..."/>
        </div>

        {/* 3. Secondary Image & 4. Body 2 */}
        <div className="p-5 bg-slate-50 border border-line rounded-2xl space-y-5">
          <div className="font-bold text-sm text-ink flex items-center gap-2">
            <Icon name="image" size={16} className="text-brand"/> Secondary Content Block (Optional)
          </div>
          <MediaUpload value={form.secondaryImage} onChange={(v) => set("secondaryImage", v)} label="3. Secondary Inline Image" type="image"/>
          <div>
            <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">
              4. Second Paragraph / Body 2
            </div>
            <textarea value={form.body2} onChange={(e) => set("body2", e.target.value)} className={`${inp} h-44 resize-y font-mono text-xs`} placeholder="Second section of article content..."/>
          </div>
        </div>

        {/* 5. Gallery Images */}
        <div className="p-5 bg-slate-50 border border-line rounded-2xl space-y-4">
          <div className="text-xs text-muted font-bold uppercase tracking-wider">
            5. Image Gallery (Multiple Side-by-Side Photos)
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {form.gallery.map((imgUrl, idx) => (<div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-line group bg-white">
                <img src={imgUrl} alt="" className="w-full h-full object-cover"/>
                <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 bg-danger text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition">
                  <Icon name="trash" size={14}/>
                </button>
              </div>))}
          </div>

          <div className="pt-2">
            <MediaUpload onChange={(url) => {
            if (url)
                addGalleryImage(url);
        }} label="Add Image to Gallery" type="image"/>
          </div>
        </div>

        {/* 6. Sidebar Video Media */}
        <div className="p-5 bg-slate-50 border border-line rounded-2xl">
          <MediaUpload value={form.videoUrl} onChange={(v) => set("videoUrl", v)} label="6. Sidebar Video (Upload File or Paste YouTube URL)" type="video"/>
        </div>

        {/* Publish Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-line">
          <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-line hover:border-brand/40">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="w-5 h-5 accent-brand"/>
            <div>
              <span className="text-sm font-bold text-ink">Published</span>
              <p className="text-xs text-muted">Visible to all visitors on site</p>
            </div>
          </label>
          <div>
            <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">
              {form.isPublished ? "Published Date & Time" : "Schedule Date & Time"}
            </div>
            <input type="datetime-local" value={form.publishedAt || ""} onChange={(e) => set("publishedAt", e.target.value)} className={inp}/>
          </div>
        </div>

        {error && <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 font-semibold">{error}</p>}

        <div className="pt-2">
          <button onClick={save} disabled={status === "saving"} className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-8 py-3 text-sm transition disabled:opacity-60 shadow-sm">
            <Icon name={status === "saved" ? "check" : "file-text"} size={16}/>
            {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save Post"}
          </button>
        </div>
      </div>
    </div>);
}
