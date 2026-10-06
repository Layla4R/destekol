"use client";
import Icon from "@/components/icons";
import { useEffect,useRef,useState } from "react";
interface MediaUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    type?: "image" | "video";
}
export default function MediaUpload({ value = "", onChange, label, type = "image", }: MediaUploadProps) {
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<"upload" | "url">("upload");
    const [urlInput, setUrlInput] = useState(value);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        setMounted(true);
    }, []);
    useEffect(() => {
        setUrlInput(value);
    }, [value]);
    if (!mounted) {
        return <div className="h-28 bg-slate-50 rounded-2xl animate-pulse border border-line"/>;
    }
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Failed to upload file");
            }
            const data = await res.json();
            if (data.url) {
                onChange(data.url);
            }
            else {
                throw new Error("No URL returned from server");
            }
        }
        catch (err: any) {
            setError(err.message || "Upload failed");
        }
        finally {
            setUploading(false);
            if (fileInputRef.current)
                fileInputRef.current.value = "";
        }
    };
    const isVideo = type === "video" || value.endsWith(".mp4") || value.endsWith(".webm") || value.includes("youtube") || value.includes("youtu.be");
    return (<div className="space-y-2.5 w-full">
      {/* Header Label & Tabs Toggle */}
      <div className="flex items-center justify-between">
        {label && <div className="text-xs font-bold text-muted uppercase tracking-wider">{label}</div>}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-line ms-auto">
          <button type="button" onClick={() => setMode("upload")} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${mode === "upload" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
            <Icon name={"file-text"} size={13}/>
            Upload
          </button>
          <button type="button" onClick={() => setMode("url")} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${mode === "url" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
            <Icon name="globe" size={13}/>
            URL
          </button>
        </div>
      </div>

      {/* Media Preview Box */}
      {value ? (<div className="relative rounded-2xl overflow-hidden border border-line bg-slate-900 aspect-video max-w-sm group shadow-sm">
          {isVideo ? (value.includes("youtube") || value.includes("youtu.be") ? (<div className="w-full h-full flex flex-col items-center justify-center text-white text-xs p-4 text-center gap-2">
                <Icon name={"file-text"} size={28} className="text-brand"/>
                <span className="font-semibold truncate max-w-full">{value}</span>
              </div>) : (<video src={value} controls className="w-full h-full object-contain"/>)) : (<img src={value} alt="Preview" className="w-full h-full object-cover"/>)}

          <button type="button" onClick={() => {
                onChange("");
                setUrlInput("");
            }} className="absolute top-2 right-2 bg-danger/90 hover:bg-danger text-white p-2 rounded-xl transition shadow-md" title="Remove">
            <Icon name="trash" size={14}/>
          </button>
        </div>) : (<>
          {/* Mode 1: Upload File Dropzone Box */}
          {mode === "upload" && (<div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-line hover:border-brand/60 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group">
              <input ref={fileInputRef} type="file" accept={type === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*"} onChange={handleFileChange} className="hidden"/>
              <div className="w-10 h-10 rounded-2xl bg-white border border-line flex items-center justify-center text-muted group-hover:text-brand group-hover:scale-110 transition shadow-sm">
                <Icon name={"file-text"} size={20}/>
              </div>
              <div className="text-xs font-bold text-ink">
                {uploading ? "Uploading..." : `Click to upload ${type}`}
              </div>
              <p className="text-[11px] text-muted">
                {type === "video" ? "MP4, WebM, MOV - Max 50MB" : "PNG, JPG, WebP, GIF - Max 5MB"}
              </p>
            </div>)}

          {/* Mode 2: Paste URL Input */}
          {mode === "url" && (<div className="flex gap-2">
              <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder={type === "video" ? "https://youtube.com/... or video link" : "https://..."} className="w-full rounded-xl border border-line bg-white py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"/>
              <button type="button" onClick={() => onChange(urlInput)} className="bg-brand text-white font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-brand-dark transition shrink-0">
                Apply
              </button>
            </div>)}
        </>)}

      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>);
}
