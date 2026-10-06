"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { FieldDef,PageSection,getBlockDefinition } from "@/lib/blocks";
import { useEffect,useRef,useState } from "react";
export default function Inspector({ section, onChange }: {
    section: PageSection;
    onChange: (props: Record<string, any>) => void;
}) {
    const def = getBlockDefinition(section.type);
    if (!def)
        return <div className="p-4 text-xs text-[#9CA3AF]">Unknown block: {section.type}</div>;
    return (<div className="p-4 space-y-5">
      {def.fields.map(field => (<FieldEditor key={field.key} field={field} value={section.props[field.key]} onChange={val => onChange({ [field.key]: val })}/>))}
      {def.fields.length === 0 && (<p className="text-[#9CA3AF] text-xs text-center py-4">No editable properties for this block.</p>)}
    </div>);
}
function FieldEditor({ field, value, onChange }: {
    field: FieldDef;
    value: any;
    onChange: (v: any) => void;
}) {
    const label = (<label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
      {field.label}
      {field.hint && <span className="text-[#9CA3AF] font-normal normal-case ml-1">— {field.hint}</span>}
    </label>);
    const inp = "w-full border border-[#E5E7EB] focus:border-[#6366F1] rounded-xl py-2.5 px-3.5 text-sm text-[#111] bg-[#F9FAFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition placeholder-[#9CA3AF]";
    if (field.type === "campaign")
        return <div>{label}<CampaignPicker value={value || ""} onChange={onChange}/></div>;
    if (field.type === "text")
        return (<div>{label}<input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`} className={inp}/></div>);
    if (field.type === "textarea")
        return (<div>{label}<textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={4} placeholder={field.placeholder} className={`${inp} resize-y`}/></div>);
    if (field.type === "number")
        return (<div>{label}<input type="number" value={value ?? ""} onChange={e => onChange(Number(e.target.value))} className={inp}/></div>);
    if (field.type === "boolean")
        return (<div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">{field.label}</span>
      <button type="button" onClick={() => onChange(!value)} aria-label={`Toggle ${field.label}`} className={`relative w-11 h-6 rounded-full transition-all shadow-inner ${value ? "bg-[#6366F1]" : "bg-[#E5E7EB]"}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-1"}`}/>
      </button>
    </div>);
    if (field.type === "select")
        return (<div>
      {label}
      <div className="flex flex-wrap gap-2">
        {field.options?.map(opt => (<button key={opt.value} onClick={() => onChange(opt.value)} aria-label={`Select ${opt.label}`} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${value === opt.value
                    ? "bg-[#6366F1] text-white border-[#6366F1] shadow-sm"
                    : "bg-white text-[#374151] border-[#E5E7EB] hover:border-[#6366F1] hover:text-[#6366F1]"}`}>
            {opt.label}
          </button>))}
      </div>
    </div>);
    if (field.type === "image")
        return (<ImageField label={field.label} value={value || ""} onChange={onChange}/>);
    if (field.type === "color")
        return (<div>
      {label}
      <div className="flex items-center gap-2">
        <input type="color" value={value || "#6366F1"} onChange={e => onChange(e.target.value)} aria-label="Color Picker" className="w-10 h-10 rounded-xl border border-[#E5E7EB] cursor-pointer p-1 bg-white"/>
        <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder="#6366F1" className={`${inp} flex-1`}/>
      </div>
    </div>);
    if (field.type === "list")
        return (<ListEditor field={field} value={Array.isArray(value) ? value : []} onChange={onChange}/>);
    return null;
}
// ── Image field with upload ───────────────────────────────────
function ImageField({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [tab, setTab] = useState<"upload" | "url">("upload");
    const inputRef = useRef<HTMLInputElement>(null);
    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await adminFetch("/api/admin/upload", { method: "POST", body: form });
            const d = await res.json();
            if (!res.ok)
                throw new Error(d.error);
            onChange(d.url);
        }
        catch (e: any) {
            alert(e.message);
        }
        finally {
            setUploading(false);
            if (inputRef.current)
                inputRef.current.value = "";
        }
    }
    return (<div>
      {label && <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">{label}</label>}

      {value && (<div className="relative mb-3 aspect-video w-full rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] group">
          <img src={value} alt="Preview" className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
            <button onClick={() => onChange("")} aria-label="Remove image" className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition">
              <Icon name="trash" size={12}/>Remove
            </button>
          </div>
        </div>)}

      <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#E5E7EB]">
          {(["upload", "url"] as const).map(t => (<button key={t} onClick={() => setTab(t)} aria-label={`Switch to ${t}`} className={`flex-1 py-2 text-[11px] font-semibold transition ${tab === t ? "bg-[#F5F3FF] text-[#6366F1]" : "text-[#9CA3AF] hover:text-[#374151]"}`}>
              {t === "upload" ? "⬆ Upload" : "🔗 URL"}
            </button>))}
        </div>
        <div className="p-3">
          {tab === "upload" ? (<button onClick={() => inputRef.current?.click()} disabled={uploading} aria-label="Upload Image File" className="w-full border-2 border-dashed border-[#C4B5FD] hover:border-[#6366F1] hover:bg-[#F5F3FF] rounded-xl py-6 flex flex-col items-center gap-2 text-[#6366F1] transition cursor-pointer disabled:opacity-60">
              {uploading
                ? <><Icon name="minus" size={24} className="animate-spin"/><span className="text-xs font-semibold">Uploading…</span></>
                : <><Icon name="image" size={24}/><span className="text-xs font-semibold">Click to upload image</span><span className="text-[10px] text-[#9CA3AF]">PNG, JPG, WebP • Max 5MB</span></>}
            </button>) : (<input value={value} onChange={e => onChange(e.target.value)} placeholder="https://example.com/image.jpg" aria-label="Image URL Input" className="w-full border border-[#E5E7EB] focus:border-[#6366F1] rounded-lg py-2 px-3 text-xs text-[#111] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition"/>)}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
    </div>);
}
// ── List field editor ─────────────────────────────────────────
function ListEditor({ field, value, onChange }: {
    field: FieldDef;
    value: any[];
    onChange: (v: any) => void;
}) {
    const [expanded, setExpanded] = useState<number | null>(0);
    function addItem() {
        const newItem: Record<string, string> = {};
        field.itemFields?.forEach(f => { newItem[f.key] = ""; });
        onChange([...value, newItem]);
        setExpanded(value.length);
    }
    function removeItem(i: number) {
        const next = value.filter((_, idx) => idx !== i);
        onChange(next);
        setExpanded(null);
    }
    function updateItem(i: number, key: string, val: string) {
        const next = value.map((item, idx) => {
            if (idx === i)
                return { ...item, [key]: val };
            return item;
        });
        onChange(next);
    }
    function moveItem(i: number, dir: "up" | "down") {
        const next = [...value];
        const swap = dir === "up" ? i - 1 : i + 1;
        [next[i], next[swap]] = [next[swap], next[i]];
        onChange(next);
    }
    const inp = "w-full border border-[#E5E7EB] focus:border-[#6366F1] rounded-lg py-2 px-3 text-xs text-[#111] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition bg-white";
    return (<div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
          {field.label} <span className="text-[#D1D5DB] font-normal">({value.length})</span>
        </label>
        <button onClick={addItem} aria-label="Add item to list" className="flex items-center gap-1 text-[#6366F1] text-xs font-semibold hover:underline">
          <Icon name="plus" size={12}/>Add
        </button>
      </div>

      <div className="space-y-1.5">
        {value.map((item, i) => (<div key={i} className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-[#F9FAFB] transition ${expanded === i ? "bg-[#F5F3FF]" : "bg-white"}`} onClick={() => setExpanded(expanded === i ? null : i)}>
              <div className="w-5 h-5 rounded-md bg-[#E0E7FF] text-[#6366F1] flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
              <span className="flex-1 text-xs font-semibold text-[#374151] truncate">
                {item.title || item.name || item.url?.split("/").pop() || `Item ${i + 1}`}
              </span>
              <div className="flex gap-0.5">
                <button onClick={e => { e.stopPropagation(); moveItem(i, "up"); }} disabled={i === 0} aria-label="Move item up" className="p-0.5 rounded text-[#9CA3AF] hover:text-[#6366F1] disabled:opacity-20"><Icon name="arrow-up" size={11}/></button>
                <button onClick={e => { e.stopPropagation(); moveItem(i, "down"); }} disabled={i === value.length - 1} aria-label="Move item down" className="p-0.5 rounded text-[#9CA3AF] hover:text-[#6366F1] disabled:opacity-20"><Icon name="arrow-down" size={11}/></button>
                <button onClick={e => { e.stopPropagation(); removeItem(i); }} aria-label="Delete item" className="p-0.5 rounded text-[#9CA3AF] hover:text-red-500"><Icon name="trash" size={11}/></button>
              </div>
              <Icon name={expanded === i ? "chevron-up" : "chevron-down"} size={13} className="text-[#9CA3AF] shrink-0"/>
            </div>

            {expanded === i && (<div className="p-3 bg-[#FAFAFA] border-t border-[#F3F4F6] space-y-3">
                {field.itemFields?.map(subField => (<div key={subField.key}>
                    <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">{subField.label}</label>
                    {subField.type === "textarea"
                        ? <textarea value={item[subField.key] || ""} onChange={e => updateItem(i, subField.key, e.target.value)} rows={3} className={`${inp} resize-none`}/>
                        : subField.type === "image"
                            ? <ImageField label="" value={item[subField.key] || ""} onChange={v => updateItem(i, subField.key, v)}/>
                            : <input value={item[subField.key] || ""} onChange={e => updateItem(i, subField.key, e.target.value)} className={inp}/>}
                  </div>))}
              </div>)}
          </div>))}
        {value.length === 0 && (<button onClick={addItem} aria-label="Add first item" className="w-full border-2 border-dashed border-[#E5E7EB] hover:border-[#C4B5FD] rounded-xl py-4 text-xs text-[#9CA3AF] hover:text-[#6366F1] transition">
            + Add first item
          </button>)}
      </div>
    </div>);
}
function CampaignPicker({ value, onChange }: {
    value: string;
    onChange: (value: string) => void;
}) {
    const [campaigns, setCampaigns] = useState<{
        id: string;
        title: string;
        isActive: boolean;
    }[]>([]);
    const [error, setError] = useState("");
    useEffect(() => { let active = true; adminFetch("/api/admin/campaigns").then(async (res) => { if (!res.ok)
        throw Error("تعذر تحميل الحملات"); return res.json(); }).then(data => { if (active)
        setCampaigns(data.campaigns || []); }).catch(() => { if (active)
        setError("تعذر تحميل الحملات، أعد فتح القسم."); }); return () => { active = false; }; }, []);
    return <><select value={value} onChange={e => onChange(e.target.value)} className="w-full border rounded-xl p-2 text-sm"><option value="">اختر حملة</option>{value && !campaigns.some(c => c.id === value) && <option value={value}>الحملة الحالية — {value}</option>}{campaigns.map(c => <option key={c.id} value={c.id} disabled={!c.isActive}>{c.title}{!c.isActive ? " (غير نشطة)" : ""}</option>)}</select>{error && <p role="alert" className="text-red-600 text-xs">{error}</p>}</>;
}
