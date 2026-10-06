"use client";
import MediaUpload from "@/components/admin/MediaUpload"; // تمت الإضافة
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { autoTranslateContent } from "@/lib/auto-translate";
import { BLOCK_CATEGORIES,BLOCK_DEFINITIONS,PageSection,createSection,getBlockDefinition,} from "@/lib/blocks";
import { useCallback,useEffect,useRef,useState } from "react";
import CanvasPreview from "./CanvasPreview";
import Inspector from "./Inspector";
// تمت إضافة الحقول الجديدة هنا
interface PageData {
    id: string;
    title: string;
    slug: string;
    description?: string;
    body?: string;
    body2?: string;
    body3?: string;
    coverImage?: string | null;
    secondaryImage?: string | null;
    gallery?: string[];
    videoUrl?: string | null;
    isPublished: boolean;
    showInMenu: boolean;
    isSystem: boolean;
    sections: PageSection[];
}
export default function PageEditor({ page, locale = "ar", isTranslation = false, hasExistingTranslation = false, isDestekol = false, initialChangesPending = false, }: {
    page: PageData;
    locale?: string;
    isTranslation?: boolean;
    hasExistingTranslation?: boolean;
    isDestekol?: boolean;
    initialChangesPending?: boolean;
}) {
    const [sections, setSections] = useState<PageSection[]>(page.sections);
    const [selectedId, setSelectedId] = useState<string | null>(page.sections.length > 0 ? page.sections[0].id : null);
    const [title, setTitle] = useState(page.title);
    // States الجديدة للإضافات
    const [description, setDescription] = useState(page.description || "");
    const [bodyText, setBodyText] = useState(page.body || "");
    const [body2Text, setBody2Text] = useState(page.body2 || "");
    const [body3Text, setBody3Text] = useState(page.body3 || "");
    const [coverImage, setCoverImage] = useState(page.coverImage || "");
    const [secondaryImage, setSecondaryImage] = useState(page.secondaryImage || "");
    const [gallery, setGallery] = useState<string[]>(Array.isArray(page.gallery) ? page.gallery : []);
    const [videoUrl, setVideoUrl] = useState(page.videoUrl || "");
    const [isPublished, setIsPublished] = useState(page.isPublished);
    const translationBusy = useRef(false);
    const [translationProgress, setTranslationProgress] = useState("");
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string>("");
    const [isDirty, setIsDirty] = useState(initialChangesPending);
    const [saveError, setSaveError] = useState<string>("");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [history, setHistory] = useState<PageSection[][]>([page.sections]);
    const [historyIdx, setHistoryIdx] = useState(0);
    const [leftTab, setLeftTab] = useState<"blocks" | "layers" | "details">("layers"); // تم تحديث التبويبات المسموحة
    const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
    const [blockSearch, setBlockSearch] = useState("");
    const [blockCat, setBlockCat] = useState("all");
    const [rightCollapsed, setRightCollapsed] = useState(false);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const latestSections = useRef(sections);
    const latestTitle = useRef(title);
    const latestIsPublished = useRef(isPublished);
    // مراجع الحقول الجديدة لمنع Stale Closure
    const latestDescription = useRef(description);
    const latestBodyText = useRef(bodyText);
    const latestBody2Text = useRef(body2Text);
    const latestBody3Text = useRef(body3Text);
    const latestCoverImage = useRef(coverImage);
    const latestSecondaryImage = useRef(secondaryImage);
    const latestGallery = useRef(gallery);
    const latestVideoUrl = useRef(videoUrl);
    useEffect(() => {
        latestSections.current = sections;
    }, [sections]);
    useEffect(() => {
        latestTitle.current = title;
    }, [title]);
    useEffect(() => {
        latestIsPublished.current = isPublished;
    }, [isPublished]);
    // تحديث المراجع للحقول الجديدة
    useEffect(() => { latestDescription.current = description; }, [description]);
    useEffect(() => { latestBodyText.current = bodyText; }, [bodyText]);
    useEffect(() => { latestBody2Text.current = body2Text; }, [body2Text]);
    useEffect(() => { latestBody3Text.current = body3Text; }, [body3Text]);
    useEffect(() => { latestCoverImage.current = coverImage; }, [coverImage]);
    useEffect(() => { latestSecondaryImage.current = secondaryImage; }, [secondaryImage]);
    useEffect(() => { latestGallery.current = gallery; }, [gallery]);
    useEffect(() => { latestVideoUrl.current = videoUrl; }, [videoUrl]);
    const selected = sections.find((s) => s.id === selectedId) ?? null;
    const selectedDef = selected ? getBlockDefinition(selected.type) : null;
    async function save() {
        if (translationBusy.current)
            return;
        setSaving(true);
        setSaveError("");
        try {
            let res: Response;
            const currentSections = latestSections.current;
            const currentTitle = latestTitle.current;
            const currentIsPublished = latestIsPublished.current;
            if (isTranslation) {
                res = await adminFetch("/api/admin/pages/translations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        pageId: page.id,
                        locale,
                        title: currentTitle,
                        description: latestDescription.current,
                        body: latestBodyText.current,
                        body2: latestBody2Text.current,
                        body3: latestBody3Text.current,
                        coverImage: latestCoverImage.current,
                        secondaryImage: latestSecondaryImage.current,
                        gallery: latestGallery.current,
                        videoUrl: latestVideoUrl.current,
                        sections: currentSections,
                    }),
                });
            }
            else {
                res = await adminFetch(`/api/admin/pages/${page.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: currentTitle,
                        description: latestDescription.current,
                        body: latestBodyText.current,
                        body2: latestBody2Text.current,
                        body3: latestBody3Text.current,
                        coverImage: latestCoverImage.current,
                        secondaryImage: latestSecondaryImage.current,
                        gallery: latestGallery.current,
                        videoUrl: latestVideoUrl.current,
                        sections: currentSections,
                        isPublished: currentIsPublished,
                        showInMenu: page.showInMenu,
                    }),
                });
            }
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setSaveError(d.error || "Failed to save. Please try again.");
            }
            else {
                setSavedAt(new Date().toLocaleTimeString());
                setIsDirty(false);
                setSaveError("");
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2500);
                try {
                    await adminFetch("/api/revalidate", { method: "POST" });
                }
                catch { }
            }
        }
        catch {
            setSaveError("Network error — check your connection.");
        }
        finally {
            setSaving(false);
        }
    }
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (translationBusy.current) {
                e.preventDefault();
                return;
            }
            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
                e.preventDefault();
                redo();
            }
            if (mod && e.key === "s") {
                e.preventDefault();
                save();
            }
            if (e.key === "Escape")
                setSelectedId(null);
            if ((e.key === "Delete" || e.key === "Backspace") &&
                selectedId &&
                !(e.target instanceof HTMLInputElement) &&
                !(e.target instanceof HTMLTextAreaElement)) {
                e.preventDefault();
                deleteSection(selectedId);
            }
        }
        window.addEventListener("keydown", onKey);
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, [selectedId, historyIdx, history, isDirty, saving]);
    const pushHistory = useCallback((next: PageSection[]) => {
        setHistory((h) => [...h.slice(0, historyIdx + 1), next]);
        setHistoryIdx((i) => i + 1);
        setSections(next);
        setIsDirty(true);
    }, [historyIdx]);
    const undo = () => {
        if (historyIdx > 0) {
            setSections(history[historyIdx - 1]);
            setHistoryIdx((i) => i - 1);
            setIsDirty(true);
        }
    };
    const redo = () => {
        if (historyIdx < history.length - 1) {
            setSections(history[historyIdx + 1]);
            setHistoryIdx((i) => i + 1);
            setIsDirty(true);
        }
    };
    function addSection(type: string) {
        const s = createSection(type);
        const next = [...sections, s];
        pushHistory(next);
        setSelectedId(s.id);
        setLeftTab("layers");
        setTimeout(() => canvasRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 100);
    }
    function deleteSection(id: string) {
        if (!confirm("Delete this block?"))
            return;
        const next = sections.filter((s) => s.id !== id);
        pushHistory(next);
        const idx = sections.findIndex((s) => s.id === id);
        setSelectedId(next[Math.min(idx, next.length - 1)]?.id ?? null);
    }
    function moveSection(id: string, dir: "up" | "down") {
        const idx = sections.findIndex((s) => s.id === id);
        if ((dir === "up" && idx === 0) ||
            (dir === "down" && idx === sections.length - 1))
            return;
        const next = [...sections];
        const swap = dir === "up" ? idx - 1 : idx + 1;
        [next[idx], next[swap]] = [next[swap], next[idx]];
        pushHistory(next);
    }
    function duplicateSection(id: string) {
        const idx = sections.findIndex((s) => s.id === id);
        const clone = {
            ...structuredClone(sections[idx]),
            id: crypto.randomUUID(),
        };
        const next = [
            ...sections.slice(0, idx + 1),
            clone,
            ...sections.slice(idx + 1),
        ];
        pushHistory(next);
        setSelectedId(clone.id);
    }
    function updateSectionProps(id: string, props: Record<string, any>) {
        setSections((prev) => {
            const next = prev.map((s) => s.id === id ? { ...s, props: { ...s.props, ...props } } : s);
            if (autoSaveTimer.current)
                clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(() => {
                setHistory((h) => [...h.slice(0, historyIdx + 1), next]);
                setHistoryIdx((i) => i + 1);
            }, 1000);
            return next;
        });
        setIsDirty(true);
    }
    const filteredBlocks = BLOCK_DEFINITIONS.filter((def) => {
        ;
        if (blockSearch)
            return (def.label.toLowerCase().includes(blockSearch.toLowerCase()) ||
                def.description.toLowerCase().includes(blockSearch.toLowerCase()));
        if (blockCat !== "all")
            return def.category === blockCat;
        return true;
    });
    const canvasMaxWidth = viewport === "desktop" ? "100%" : viewport === "tablet" ? "768px" : "390px";
    const inpClass = "w-full border border-[#E5E7EB] focus:border-[#6366F1] rounded-xl py-2 px-3 text-xs text-[#111] bg-[#F9FAFB] focus:bg-white focus:outline-none transition";
    return (<div className="flex flex-col w-full flex-1 overflow-hidden bg-[#F0F2F7] min-h-0" // تمت الإضافة هنا (min-h-0)
     style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {" "}
      {translationProgress && (<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/30" role="status" aria-live="polite">
          <div className="rounded-xl bg-white p-6 shadow-xl text-sm font-semibold">{translationProgress}</div>
        </div>)}
      {saveSuccess && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] bg-success text-white text-xs font-bold rounded-xl px-5 py-2.5 shadow-lg flex items-center gap-2">
          <Icon name="check" size={14}/> Page saved successfully
        </div>)}
      {/* ══ TOP BAR ════════════════════════════════════════════ */}
      <div className="h-[52px] bg-white border-b border-[#E2E5ED] flex items-center px-4 gap-4 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <a href={isTranslation ? `/admin/pages?lang=${locale}` : "/admin/pages"} onClick={(e) => {
            if (isDirty &&
                !confirm("You have unsaved changes. Leave without saving?"))
                e.preventDefault();
        }} className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#111] text-xs font-medium transition shrink-0">
            <Icon name="arrow-left" size={14}/>
            Pages
          </a>
          <span className="text-[#D1D5DB]">/</span>
          <input value={title} onChange={(e) => {
            setTitle(e.target.value);
            setIsDirty(true);
        }} className="text-[#111] font-semibold text-sm bg-transparent focus:outline-none border-b border-transparent focus:border-[#6366F1] pb-0.5 min-w-[140px] max-w-[280px] transition-colors"/>
          {/* هنا زر الترجمة الخاص بك بالكامل بدون أي تغيير */}
          {isTranslation && (<div className="flex items-center gap-2">
              <button type="button" disabled={saving} onClick={async () => {
                if (translationBusy.current || saving)
                    return;
                if (!confirm("نسخ المحتوى والصور والأقسام من النسخة العربية المحفوظة وترجمتها؟ سيستبدل ذلك تعديلات هذه اللغة عند نجاح العملية."))
                    return;
                translationBusy.current = true;
                setSaving(true);
                setTranslationProgress("جلب المحتوى العربي…");
                try {
                    const res = await adminFetch("/api/admin/pages/" + page.id, { cache: "no-store" });
                    const data = await res.json();
                    if (!res.ok || !data.page)
                        throw new Error(data.error || "فشل جلب الصفحة العربية");
                    const original = data.page;
                    const translated = await autoTranslateContent({
                        title: original.title || "", description: original.description || "",
                        body: original.body || "", body2: original.body2 || "", body3: original.body3 || "",
                        coverImage: original.coverImage || "", secondaryImage: original.secondaryImage || "",
                        gallery: Array.isArray(original.gallery) ? original.gallery : [], videoUrl: original.videoUrl || "",
                        sections: Array.isArray(original.sections) ? original.sections : [],
                    }, locale, (done, total) => setTranslationProgress("ترجمة " + done + "/" + total));
                    if (autoSaveTimer.current)
                        clearTimeout(autoSaveTimer.current);
                    setTitle(translated.title);
                    latestTitle.current = translated.title;
                    setDescription(translated.description);
                    latestDescription.current = translated.description;
                    setBodyText(translated.body);
                    latestBodyText.current = translated.body;
                    setBody2Text(translated.body2);
                    latestBody2Text.current = translated.body2;
                    setBody3Text(translated.body3);
                    latestBody3Text.current = translated.body3;
                    setCoverImage(translated.coverImage);
                    latestCoverImage.current = translated.coverImage;
                    setSecondaryImage(translated.secondaryImage);
                    latestSecondaryImage.current = translated.secondaryImage;
                    setGallery(translated.gallery);
                    latestGallery.current = translated.gallery;
                    setVideoUrl(translated.videoUrl);
                    latestVideoUrl.current = translated.videoUrl;
                    setSections(translated.sections);
                    latestSections.current = translated.sections;
                    setHistory([translated.sections]);
                    setHistoryIdx(0);
                    setSelectedId(translated.sections[0]?.id || null);
                    setIsDirty(true);
                    alert("تمت ترجمة المحتوى ونسخ الصور والأقسام. اضغط Save لحفظ الترجمة.");
                }
                catch (error) {
                    alert(error instanceof Error ? error.message : "فشلت الترجمة؛ لم يتم استبدال المحتوى.");
                }
                finally {
                    translationBusy.current = false;
                    setSaving(false);
                    setTranslationProgress("");
                }
            }} className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition flex items-center gap-1.5 shrink-0 shadow-sm">
                <span>{translationProgress || "✨ ترجمة تلقائية (Google)"}</span>
              </button>
            </div>)}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={undo} disabled={historyIdx === 0} title="Undo (⌘Z)" aria-label="Undo Action" className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-30 transition">
            <Icon name="undo" size={16}/>
          </button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo (⌘⇧Z)" aria-label="Redo Action" className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-30 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 1 21 7 15 13"/>
              <path d="M9 18H3v-5"/>
              <path d="M21 7H8a5 5 0 0 0-5 5"/>
            </svg>
          </button>
          <div className="w-px h-5 bg-[#E5E7EB] mx-1"/>
          {(["desktop", "tablet", "mobile"] as const).map((v) => (<button key={v} onClick={() => setViewport(v)} title={v} aria-label={`Switch to ${v} view`} className={`p-2 rounded-lg transition ${viewport === v ? "bg-[#6366F1] text-white shadow-sm" : "text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6]"}`}>
              <Icon name={v === "desktop"
                ? "monitor"
                : v === "tablet"
                    ? "tablet"
                    : "smartphone"} size={16}/>
            </button>))}
          <div className="w-px h-5 bg-[#E5E7EB] mx-1"/>
          <a href={page.slug === "home"
            ? locale === "ar"
                ? "/"
                : `/${locale}/`
            : locale === "ar"
                ? `/${page.slug}`
                : `/${locale}/${page.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 text-[#6B7280] hover:text-[#111] text-xs font-medium hover:bg-[#F3F4F6] rounded-lg transition">
            <Icon name="globe" size={14}/> Preview
          </a>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          {saveError && (<span className="text-xs text-red-500 font-medium max-w-[200px] truncate">
              {saveError}
            </span>)}
          {isDirty && !saving && !saveError && (<span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse"/>
              Unsaved changes
            </span>)}
          {savedAt && !isDirty && !saveError && (<span className="text-xs text-[#9CA3AF]">Saved at {savedAt}</span>)}
          {!isTranslation && (<button onClick={() => {
                setIsPublished((p) => !p);
                setIsDirty(true);
            }} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${isPublished
                ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] hover:bg-[#D1FAE5]"
                : "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]"}`}>
              <Icon name={isPublished ? "check" : "minus"} size={12}/>
              {isPublished ? "Published" : "Draft"}
            </button>)}
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-1.5 text-xs transition shadow-sm">
            <Icon name={saving ? "minus" : "check"} size={14}/>
            {saving ? "Saving…" : "Save  ⌘S"}
          </button>
        </div>
      </div>
      {/* ══ BODY ════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden min-h-0"> {/* تمت الإضافة هنا (min-h-0) */}
        {/* ── LEFT PANEL ─────────────────────────────────────── */}
        <div className="w-[280px] bg-white border-r border-[#E2E5ED] flex flex-col shrink-0 overflow-hidden">
          <div className="flex border-b border-[#E2E5ED] shrink-0">
            {/* تمت إضافة تبويبة التفاصيل (Media & Text) هنا */}
            {[
            ["layers", "Layers", "layers"] as const,
            ["blocks", "+ Block", "layout-grid"] as const,
            ["details", "Media & Text", "file-text"] as const,
        ].map(([val, label, icon]) => (<button key={val} onClick={() => setLeftTab(val)} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-bold transition border-b-2 ${leftTab === val
                ? "text-[#6366F1] border-[#6366F1]"
                : "text-[#9CA3AF] border-transparent hover:text-[#374151]"}`}>
                <Icon name={icon} size={12}/>
                {label}
              </button>))}
          </div>

          {leftTab === "details" ? (<div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs min-h-0"> {/* تمت الإضافة هنا (min-h-0) */}
              <div className="font-bold text-[#374151] border-b pb-2 flex items-center gap-1.5">
                <Icon name="file-text" size={14} className="text-[#6366F1]"/>
                Project Article Data
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase mb-1">
                  Excerpt / Project Summary
                </label>
                <textarea value={description} onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
            }} rows={2} className={inpClass} placeholder="Short summary of project..."/>
              </div>

              <MediaUpload value={coverImage || ""} onChange={(url) => {
                setCoverImage(url);
                setIsDirty(true);
            }} label="1. Main Banner Image" type="image"/>

              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase mb-1">
                  2. Primary Body Paragraph
                </label>
                <textarea value={bodyText} onChange={(e) => {
                setBodyText(e.target.value);
                setIsDirty(true);
            }} rows={5} className={`${inpClass} font-mono`} placeholder="First section of text..."/>
              </div>

              <MediaUpload value={secondaryImage || ""} onChange={(url) => {
                setSecondaryImage(url);
                setIsDirty(true);
            }} label="3. Secondary Inline Image" type="image"/>

              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase mb-1">
                  4. Second Body Paragraph (Body 2)
                </label>
                <textarea value={body2Text} onChange={(e) => {
                setBody2Text(e.target.value);
                setIsDirty(true);
            }} rows={4} className={`${inpClass} font-mono`} placeholder="Second section of text..."/>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase mb-1">
                  5. Third Body Paragraph (Body 3)
                </label>
                <textarea value={body3Text} onChange={(e) => {
                setBody3Text(e.target.value);
                setIsDirty(true);
            }} rows={4} className={`${inpClass} font-mono`} placeholder="Third section of text..."/>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase">
                    6. Photo Gallery ({gallery.length})
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {gallery.map((img, idx) => (<div key={idx} className="relative aspect-video rounded-lg overflow-hidden border bg-black group">
                        <img src={img} alt="" className="w-full h-full object-cover"/>
                        <button type="button" onClick={() => {
                    setGallery(gallery.filter((_, i) => i !== idx));
                    setIsDirty(true);
                }} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                          <Icon name="x" size={10}/>
                        </button>
                      </div>))}
                  </div>
                  <MediaUpload onChange={(url) => {
                if (url) {
                    setGallery([...gallery, url]);
                    setIsDirty(true);
                }
            }} label="Add Gallery Photo" type="image"/>
                </div>

              <div className="pt-2 border-t border-[#E5E7EB]">
                <MediaUpload value={videoUrl || ""} onChange={(url) => {
                setVideoUrl(url);
                setIsDirty(true);
            }} label="7. Sidebar Sticky Video" type="video"/>
              </div>
            </div>) : leftTab === "blocks" ? (<div className="flex flex-col flex-1 overflow-hidden min-h-0"> {/* تمت الإضافة هنا (min-h-0) */}
              <div className="p-3 pb-2 border-b border-[#F3F4F6]">
                <div className="relative">
                  <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"/>
                  <input value={blockSearch} onChange={(e) => {
                setBlockSearch(e.target.value);
                setBlockCat("all");
            }} placeholder="Search blocks…" className="w-full border border-[#E5E7EB] rounded-lg py-2 pl-8 pr-3 text-xs text-[#374151] bg-[#F9FAFB] focus:outline-none focus:border-[#6366F1] focus:bg-white transition"/>
                </div>
              </div>
              {!blockSearch && (<div className="px-3 py-2 flex flex-wrap gap-1 border-b border-[#F3F4F6]">
                  {BLOCK_CATEGORIES.map((cat) => (<button key={cat.id} onClick={() => setBlockCat(cat.id)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${blockCat === cat.id
                        ? "bg-[#6366F1] text-white shadow-sm"
                        : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#374151]"}`}>
                      {cat.label}
                    </button>))}
                </div>)}
              <div className="flex-1 overflow-y-auto p-2 min-h-0"> {/* تمت الإضافة هنا (min-h-0) */}
                <div className="grid grid-cols-1 gap-1">
                  {filteredBlocks.map((def) => (<button key={def.type} onClick={() => addSection(def.type)} className="flex items-center gap-3 text-left px-3 py-3 rounded-xl hover:bg-[#F5F3FF] hover:border-[#C4B5FD] border border-transparent transition group">
                      <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] group-hover:bg-[#6366F1] text-[#6366F1] group-hover:text-white flex items-center justify-center shrink-0 transition">
                        <Icon name={def.icon} size={17}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#111] font-semibold text-xs">
                          {def.label}
                        </div>
                        <div className="text-[#9CA3AF] text-[10px] mt-0.5 leading-tight">
                          {def.description}
                        </div>
                      </div>
                    </button>))}
                  {filteredBlocks.length === 0 && (<div className="text-center py-8 text-[#9CA3AF] text-xs">
                      No blocks found
                    </div>)}
                </div>
              </div>
            </div>) : (<div className="flex-1 overflow-y-auto min-h-0"> {/* تمت الإضافة هنا (min-h-0) */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    {sections.length} Blocks
                  </span>
                  <button onClick={() => setLeftTab("blocks")} className="text-[#6366F1] text-[11px] font-semibold hover:underline flex items-center gap-0.5">
                    <Icon name="plus" size={11}/>
                    Add
                  </button>
                </div>
                {sections.length === 0 ? (<div className="text-center py-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
                      <Icon name="layout-grid" size={22} className="text-[#D1D5DB]"/>
                    </div>
                    <p className="text-[#9CA3AF] text-xs">No blocks yet</p>
                    <button onClick={() => setLeftTab("blocks")} className="text-[#6366F1] text-xs font-semibold mt-1 hover:underline">
                      + Add your first block
                    </button>
                  </div>) : (<div className="space-y-1">
                    {sections.map((s, idx) => {
                    const def = getBlockDefinition(s.type);
                    const isActive = s.id === selectedId;
                    return (<div key={s.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition group border ${isActive
                            ? "bg-[#F5F3FF] border-[#C4B5FD] text-[#6366F1]"
                            : "border-transparent hover:bg-[#F9FAFB] text-[#374151]"}`} onClick={() => setSelectedId(s.id)}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-[#6366F1] text-white" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                            <Icon name={def?.icon || "minus"} size={13}/>
                          </div>
                          <span className="flex-1 text-xs font-semibold truncate">
                            {def?.label || s.type}
                          </span>
                          <span className={`text-[10px] font-mono ${isActive ? "text-[#A5B4FC]" : "text-[#D1D5DB]"}`}>
                            {idx + 1}
                          </span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={(e) => {
                            e.stopPropagation();
                            moveSection(s.id, "up");
                        }} disabled={idx === 0} aria-label="اسم الزر" className="p-0.5 rounded hover:bg-[#E0E7FF] text-[#6366F1] disabled:opacity-20">
                              <Icon name="arrow-up" size={11}/>
                            </button>
                            <button onClick={(e) => {
                            e.stopPropagation();
                            moveSection(s.id, "down");
                        }} disabled={idx === sections.length - 1} aria-label="اسم الزر" className="p-0.5 rounded hover:bg-[#E0E7FF] text-[#6366F1] disabled:opacity-20">
                              <Icon name="arrow-down" size={11}/>
                            </button>
                          </div>
                        </div>);
                })}
                  </div>)}
              </div>
            </div>)}
        </div>

        {/* ── CANVAS ─────────────────────────────────────────── */}
        <div ref={canvasRef} className="flex-1 overflow-y-auto flex flex-col items-center py-6 px-4 min-h-0" // تمت الإضافة هنا (min-h-0)
    >
          {sections.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs">
              <div className="w-24 h-24 rounded-3xl bg-white border-2 border-dashed border-[#C4B5FD] flex items-center justify-center mb-5">
                <Icon name="layout-grid" size={36} className="text-[#A5B4FC]"/>
              </div>
              <h3 className="text-[#374151] font-bold text-lg mb-2">
                Start Building
              </h3>
              <p className="text-[#9CA3AF] text-sm mb-4">
                Click "+ Add Block" to add your first section
              </p>
              <button onClick={() => setLeftTab("blocks")} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition shadow-sm">
                + Add Block
              </button>
            </div>) : (<div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-[#E2E5ED] transition-all duration-300 w-full" style={{ maxWidth: canvasMaxWidth }}>
              {sections.map((section, idx) => (<SectionWrapper key={section.id} section={section} idx={idx} total={sections.length} isSelected={section.id === selectedId} onSelect={() => setSelectedId(section.id)} onDelete={() => deleteSection(section.id)} onMoveUp={() => moveSection(section.id, "up")} onMoveDown={() => moveSection(section.id, "down")} onDuplicate={() => duplicateSection(section.id)}/>))}
              <div onClick={() => setLeftTab("blocks")} className="border-2 border-dashed border-[#E5E7EB] hover:border-[#C4B5FD] m-4 mt-0 rounded-xl py-5 flex items-center justify-center gap-2 text-[#9CA3AF] hover:text-[#6366F1] cursor-pointer transition group">
                <Icon name="plus" size={16}/>
                <span className="text-xs font-semibold">Add Block</span>
              </div>
            </div>)}
        </div>

        {/* ── RIGHT INSPECTOR ────────────────────────────────── */}
        {!rightCollapsed && (<div className="w-[280px] bg-white border-l border-[#E2E5ED] flex flex-col shrink-0 overflow-hidden">
            <div className="h-[44px] flex items-center justify-between px-4 border-b border-[#E2E5ED] shrink-0">
              {selected && selectedDef ? (<div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#F5F3FF] text-[#6366F1] flex items-center justify-center shrink-0">
                    <Icon name={selectedDef.icon} size={13}/>
                  </div>
                  <span className="text-xs font-bold text-[#374151] truncate">
                    {selectedDef.label}
                  </span>
                </div>) : (<span className="text-xs font-bold text-[#9CA3AF]">
                  Properties
                </span>)}
              <button onClick={() => setRightCollapsed(true)} aria-label="Collapse Inspector" className="text-[#D1D5DB] hover:text-[#6B7280] transition p-1 rounded">
                <Icon name="x" size={14}/>
              </button>
            </div>

            {selected ? (<div className="flex-1 overflow-y-auto min-h-0"> {/* تمت الإضافة هنا (min-h-0) */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-[#F3F4F6]">
                  <button onClick={() => moveSection(selected.id, "up")} disabled={sections.indexOf(selected) === 0} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-[#F3F4F6] disabled:opacity-30 text-[#6B7280] text-[11px] font-medium transition">
                    <Icon name="arrow-up" size={12}/>
                    Up
                  </button>
                  <button onClick={() => moveSection(selected.id, "down")} disabled={sections.indexOf(selected) === sections.length - 1} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-[#F3F4F6] disabled:opacity-30 text-[#6B7280] text-[11px] font-medium transition">
                    <Icon name="arrow-down" size={12}/>
                    Down
                  </button>
                  <button onClick={() => duplicateSection(selected.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium transition">
                    <Icon name="copy" size={12}/>
                    Copy
                  </button>
                  <button onClick={() => deleteSection(selected.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#EF4444] text-[11px] font-medium transition">
                    <Icon name="trash" size={12}/>
                    Del
                  </button>
                </div>
                <Inspector section={selected} onChange={(props) => updateSectionProps(selected.id, props)}/>
              </div>) : (<div className="flex-1 flex flex-col items-center justify-center text-center px-6 min-h-0"> {/* تمت الإضافة هنا (min-h-0) */}
                <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] flex items-center justify-center mb-3">
                  <Icon name="settings" size={24} className="text-[#A5B4FC]"/>
                </div>
                <p className="text-[#374151] font-semibold text-sm mb-1">
                  No block selected
                </p>
                <p className="text-[#9CA3AF] text-xs">
                  Click any block on the canvas to edit its properties
                </p>
              </div>)}
          </div>)}

        {rightCollapsed && (<button onClick={() => setRightCollapsed(false)} aria-label="Expand Inspector" className="fixed right-0 top-1/2 -translate-y-1/2 bg-white border border-[#E2E5ED] border-r-0 rounded-l-xl p-2 shadow-md text-[#6B7280] hover:text-[#6366F1] transition z-40">
            <Icon name="settings" size={16}/>
          </button>)}
      </div>
    </div>);
}
function SectionWrapper({ section, idx, total, isSelected, onSelect, onDelete, onMoveUp, onMoveDown, onDuplicate, }: {
    section: PageSection;
    idx: number;
    total: number;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDuplicate: () => void;
}) {
    const def = getBlockDefinition(section.type);
    return (<div onClick={onSelect} className={`relative group cursor-pointer transition-all ${isSelected
            ? "outline outline-2 outline-[#6366F1] outline-offset-0"
            : "hover:outline hover:outline-1 hover:outline-[#C4B5FD] hover:outline-offset-0"}`}>
      <div className={`absolute top-0 left-0 z-10 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold shadow-sm transition-opacity ${isSelected
            ? "opacity-100 bg-[#6366F1] text-white"
            : "opacity-0 group-hover:opacity-100 bg-white text-[#6366F1] border border-[#C4B5FD]"}`} style={{ borderBottomRightRadius: 8, borderTopLeftRadius: 0 }}>
        <Icon name={def?.icon || "minus"} size={11}/>
        {def?.label || section.type}
      </div>

      {isSelected && (<div className="absolute top-0 right-0 z-10 flex items-center gap-0.5 p-1.5 bg-[#6366F1] shadow-sm" style={{ borderBottomLeftRadius: 10 }}>
          {[
                {
                    icon: "arrow-up",
                    label: "Move Up",
                    action: onMoveUp,
                    disabled: idx === 0,
                },
                {
                    icon: "arrow-down",
                    label: "Move Down",
                    action: onMoveDown,
                    disabled: idx === total - 1,
                },
                {
                    icon: "copy",
                    label: "Duplicate",
                    action: onDuplicate,
                    disabled: false,
                },
                {
                    icon: "trash",
                    label: "Delete",
                    action: onDelete,
                    disabled: false,
                    danger: true,
                },
            ].map((btn) => (<button key={btn.label} onClick={(e) => {
                    e.stopPropagation();
                    btn.action();
                }} disabled={btn.disabled} title={btn.label} className={`w-7 h-7 rounded-lg flex items-center justify-center text-white transition disabled:opacity-30 ${btn.danger ? "hover:bg-red-500/70" : "hover:bg-white/20"}`}>
              <Icon name={btn.icon as any} size={13}/>
            </button>))}
        </div>)}

      <div className={`absolute bottom-2 right-2 z-10 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition ${isSelected
            ? "bg-[#6366F1] text-white"
            : "bg-white/90 text-[#9CA3AF] border border-[#E5E7EB]"}`}>
        {idx + 1}
      </div>

      <CanvasPreview section={section}/>
    </div>);
}
