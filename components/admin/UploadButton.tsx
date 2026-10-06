"use client";
import Icon from "@/components/icons";
import { adminFetch } from "@/lib/admin-fetch";
import { useRef,useState } from "react";
export default function UploadButton({ onUploaded, label = "Upload File", accept = "image/*,video/*", className = "", }: {
    onUploaded: (url: string) => void;
    label?: string;
    accept?: string;
    className?: string;
}) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const ref = useRef<HTMLInputElement>(null);
    async function handle(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setBusy(true);
        setErr("");
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await adminFetch("/api/admin/upload", { method: "POST", body: fd });
            const d = await res.json();
            if (d.url) {
                onUploaded(d.url);
            }
            else {
                setErr(d.error || "Upload failed");
            }
        }
        catch {
            setErr("Network error");
        }
        finally {
            setBusy(false);
            if (ref.current)
                ref.current.value = "";
        }
    }
    return (<div className={className}>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handle}/>
      <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="flex items-center gap-1.5 text-[11px] border border-line text-muted rounded-xl px-3 py-1.5 hover:border-brand hover:text-brand transition disabled:opacity-50 w-full justify-center bg-dashbg font-medium">
        <Icon name={busy ? "help-circle" : "image"} size={12}/>
        {busy ? "Uploading…" : label}
      </button>
      {err && <p className="text-[10px] text-danger mt-1">{err}</p>}
    </div>);
}
