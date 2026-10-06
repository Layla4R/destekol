"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useCallback,useEffect,useState } from "react";
const LOCALES = [
    { code: "ar", flag: "🇸🇦", name: "العربية" },
    { code: "en", flag: "🇬🇧", name: "English" },
    { code: "fr", flag: "🇫🇷", name: "Français" },
    { code: "tr", flag: "🇹🇷", name: "Türkçe" },
];
const KEY_GROUPS = ["nav", "hero", "campaigns", "donate", "auth", "account", "news", "cart", "footer", "common", "legal"];
interface Row {
    id: string;
    locale: string;
    key: string;
    value: string;
    isFromDB?: boolean;
}
export default function TranslationsPage() {
    const [locale, setLocale] = useState("ar");
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [group, setGroup] = useState("all");
    const [editing, setEditing] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);
    const [unsaved, setUnsaved] = useState<Set<string>>(new Set());
    const [addingKey, setAddingKey] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    async function saveAll() {
        const keys = [...unsaved];
        if (!keys.length)
            return;
        setSaving("__all__");
        // Build batch payload
        const updates = keys.map(key => {
            const row = rows.find(r => r.key === key);
            return { locale, key, value: editing[key] ?? row?.value ?? "" };
        }).filter(u => u.key);
        try {
            // Try batch endpoint first
            const res = await adminFetch("/api/admin/translations", {
                method: "PATCH",
                body: JSON.stringify({ batch: updates }),
            });
            if (res.ok) {
                setUnsaved(new Set());
                setEditing({});
            }
            else {
                // Fallback: save one by one
                for (const u of updates) {
                    await adminFetch("/api/admin/translations", {
                        method: "PATCH",
                        body: JSON.stringify(u),
                    });
                }
                setUnsaved(new Set());
                setEditing({});
            }
        }
        catch {
            // Fallback: save one by one
            for (const u of updates) {
                await adminFetch("/api/admin/translations", {
                    method: "PATCH",
                    body: JSON.stringify(u),
                });
            }
            setUnsaved(new Set());
            setEditing({});
        }
        setSaving(null);
        // Revalidate site cache after saving translations
        try {
            await adminFetch("/api/revalidate", { method: "POST" });
        }
        catch { }
    }
    async function addKey() {
        if (!newKey.trim() || !newValue.trim())
            return;
        await adminFetch("/api/admin/translations", {
            method: "PATCH",
            body: JSON.stringify({ locale, key: newKey.trim(), value: newValue.trim() }),
        });
        setNewKey("");
        setNewValue("");
        setAddingKey(false);
        await load();
    }
    const load = useCallback(async () => {
        setLoading(true);
        const res = await adminFetch(`/api/admin/translations?locale=${locale}`);
        const d = await res.json();
        setRows(d.translations || []);
        setLoading(false);
        setEditing({});
        setUnsaved(new Set());
    }, [locale]);
    useEffect(() => { load(); }, [load]);
    // Warn before leaving with unsaved changes
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (unsaved.size > 0) {
                e.preventDefault();
                e.returnValue = "";
            }
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [unsaved.size]);
    const filtered = rows.filter(r => {
        if (group !== "all" && !r.key.startsWith(`${group}.`))
            return false;
        if (search) {
            const s = search.toLowerCase();
            return r.key.includes(s) || r.value.toLowerCase().includes(s);
        }
        return true;
    });
    async function saveLine(key: string, value: string) {
        setSaving(key);
        await adminFetch("/api/admin/translations", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale, key, value }),
        });
        setSaving(null);
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
        setEditing(e => { const n = { ...e }; delete n[key]; return n; });
        setUnsaved(u => { const n = new Set(u); n.delete(key); return n; });
        setRows(r => r.map(row => row.key === key ? { ...row, value } : row));
    }
    return (<div className="p-6 sm:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold text-ink mb-1">Translations</h1>
          {unsaved.size > 0 && (<div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1 font-semibold">
                {unsaved.size} unsaved
              </span>
              <button onClick={saveAll} disabled={!!saving} className="text-xs bg-brand text-white font-bold rounded-xl px-3 py-1.5 hover:bg-brand-dark transition disabled:opacity-60">
                Save All
              </button>
            </div>)}
        </div>
        <p className="text-muted text-sm">Edit all site text directly. Changes save to DB and go live within 1 minute.</p>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => setAddingKey(v => !v)} className="flex items-center gap-1.5 text-xs border border-line text-muted hover:border-brand hover:text-brand rounded-xl px-3 py-1.5 transition">
            <Icon name="plus" size={12}/> Add Custom Key
          </button>
        </div>
      </div>

      {/* Locale tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {LOCALES.map(l => (<button key={l.code} onClick={() => {
                if (unsaved.size > 0 && locale !== l.code && !confirm(`You have ${unsaved.size} unsaved change(s). Switch locale and lose them?`))
                    return;
                setLocale(l.code);
            }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${locale === l.code ? "bg-brand text-white border-brand" : "bg-white border-line text-muted hover:border-brand hover:text-brand"}`}>
            <span>{l.flag}</span>{l.name}
          </button>))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input type="search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-xl border border-line bg-white py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 flex-1 min-w-48"/>
        <select value={group} onChange={e => setGroup(e.target.value)} className="rounded-xl border border-line bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
          <option value="all">All sections</option>
          {KEY_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Add new key form */}
      {addingKey && (<div className="bg-brand/5 border border-brand/20 rounded-2xl p-4 mb-4 space-y-3">
          <p className="text-xs font-bold text-brand uppercase tracking-wider">Add Custom Translation Key</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted font-semibold mb-1">Key (e.g. legal.privacy_title)</label>
              <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="group.key_name" className="w-full rounded-xl border border-line bg-white py-2 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/30"/>
            </div>
            <div>
              <label className="block text-xs text-muted font-semibold mb-1">Value for {locale}</label>
              <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Translation value..." className="w-full rounded-xl border border-line bg-white py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30"/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addKey} disabled={!newKey.trim() || !newValue.trim()} className="bg-brand text-white font-bold rounded-xl px-4 py-2 text-xs hover:bg-brand-dark disabled:opacity-50 transition">
              Add Key
            </button>
            <button onClick={() => { setAddingKey(false); setNewKey(""); setNewValue(""); }} className="text-muted text-xs hover:text-ink transition px-3">Cancel</button>
          </div>
        </div>)}

      {loading ? (<div className="text-center py-16 text-muted">Loading...</div>) : (<div className="bg-white rounded-xl2 border border-line overflow-hidden">
          <div className="px-4 py-3 border-b border-line bg-dashbg flex items-center justify-between">
            <span className="text-xs text-muted font-semibold">{filtered.length} keys</span>
            <span className="text-xs text-muted">Click any value → edit → Enter to save</span>
          </div>
          <div className="divide-y divide-line">
            {filtered.map(row => {
                const isEditing = row.key in editing;
                const currentVal = editing[row.key] ?? row.value;
                const isSaving = saving === row.key;
                const isSaved = saved === row.key;
                const changed = isEditing && editing[row.key] !== row.value;
                return (<div key={row.key} className="flex items-start gap-4 px-4 py-3 hover:bg-dashbg/50 transition">
                  <div className="w-52 shrink-0 pt-0.5">
                    <div className="text-xs font-mono text-brand/60">{row.key.split(".")[0]}</div>
                    <div className="text-xs font-mono text-ink font-semibold">.{row.key.split(".").slice(1).join(".")}</div>
                    {!row.isFromDB && <div className="text-[9px] text-muted/50 mt-0.5">fallback</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (<textarea value={currentVal} onChange={e => setEditing(ed => ({ ...ed, [row.key]: e.target.value }))} onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                saveLine(row.key, currentVal);
                            }
                            if (e.key === "Escape") {
                                setEditing(ed => { const n = { ...ed }; delete n[row.key]; return n; });
                            }
                        }} rows={Math.max(1, currentVal.split("\n").length)} className="w-full rounded-lg border border-brand/40 bg-white py-1.5 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none" autoFocus/>) : (<p className="text-sm text-ink cursor-pointer hover:text-brand transition py-1 leading-relaxed" onClick={() => setEditing(ed => ({ ...ed, [row.key]: row.value }))}>
                        {row.value || <span className="text-danger/50 italic text-xs">empty</span>}
                      </p>)}
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 w-20 justify-end">
                    {isSaved && <span className="text-xs text-success flex items-center gap-1"><Icon name="check" size={12}/>Saved</span>}
                    {isSaving && <Icon name="minus" size={14} className="text-brand animate-spin"/>}
                    {changed && !isSaving && (<>
                        <button onClick={() => saveLine(row.key, currentVal)} className="text-xs bg-brand text-white font-bold rounded-lg px-2.5 py-1 hover:bg-brand-dark transition">
                          Save
                        </button>
                        <button onClick={() => setEditing(ed => { const n = { ...ed }; delete n[row.key]; return n; })} className="text-muted hover:text-ink">✕</button>
                      </>)}
                  </div>
                </div>);
            })}
            {filtered.length === 0 && <div className="py-12 text-center text-muted">No translations found</div>}
          </div>
        </div>)}
    </div>);
}
