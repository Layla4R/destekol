"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useRef,useState } from "react";
interface Props {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    placeholder?: string;
}
export default function ImageUpload({ value, onChange, label = "Image", placeholder = "https://... or upload below" }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        setError("");
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
            setError(e.message);
        }
        finally {
            setUploading(false);
            if (inputRef.current)
                inputRef.current.value = "";
        }
    }
    const inp = "w-full rounded-xl border border-line bg-dashbg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
    return (<div>
      <label className="block text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className={inp} placeholder={placeholder}/>
      {value && (
        // Preview
        <div className="mt-2 relative h-32 bg-dashbg rounded-xl overflow-hidden border border-line group">
          <img src={value} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")}/>
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 w-6 h-6 bg-danger rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <Icon name="x" size={12}/>
          </button>
        </div>)}
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-xs border border-line rounded-lg px-3 py-2 text-muted hover:border-brand hover:text-brand transition font-semibold disabled:opacity-50">
          <Icon name={uploading ? "minus" : "plus"} size={13}/>
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
        <span className="text-xs text-muted">JPG, PNG, WebP, GIF — max 5MB</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>);
}
