"use client";
import Icon from "@/components/icons";
import { createContext,ReactNode,useCallback,useContext,useState } from "react";
type ToastType = "success" | "error" | "info";
interface Toast {
    id: number;
    type: ToastType;
    message: string;
}
interface ToastCtx {
    toast: (message: string, type?: ToastType) => void;
}
const ToastContext = createContext<ToastCtx>({ toast: () => { } });
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }: {
    children: ReactNode;
}) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toast = useCallback((message: string, type: ToastType = "success") => {
        const id = Date.now();
        setToasts(t => [...t, { id, type, message }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    }, []);
    return (<ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (<div key={t.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl border text-sm font-semibold min-w-[260px] max-w-xs pointer-events-auto animate-in slide-in-from-bottom-2 ${t.type === "success" ? "bg-white border-success/30 text-success" :
                t.type === "error" ? "bg-white border-danger/30 text-danger" :
                    "bg-white border-brand/30 text-brand"}`}>
            <Icon name={t.type === "success" ? "check" : t.type === "error" ? "x" : "help-circle"} size={16} className="shrink-0"/>
            <span className="text-ink">{t.message}</span>
          </div>))}
      </div>
    </ToastContext.Provider>);
}
