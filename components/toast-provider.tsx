"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X } from "lucide-react";

type Toast = { id: number; type: "success" | "error" | "info" | "warning"; message: string };
type ToastContextType = { notify: (type: Toast["type"], message: string) => void };
const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const value = useMemo(() => ({
    notify(type: Toast["type"], message: string) {
      const id = Date.now();
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4000);
    },
  }), []);
  return <ToastContext.Provider value={value}>{children}<div className="fixed right-4 top-4 z-[80] flex w-[min(92vw,360px)] flex-col gap-3">{toasts.map((toast) => <div key={toast.id} className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl"><div className="flex items-start gap-3"><span className="mt-0.5 text-emerald-700">{toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}</span><p className="flex-1 text-sm font-semibold leading-6 text-stone-800">{toast.message}</p><button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label="Fechar aviso" className="text-stone-400 hover:text-stone-700"><X className="h-4 w-4" /></button></div><span className="toast-progress absolute inset-x-0 bottom-0 h-1 bg-emerald-600" /></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast deve ser usado dentro de ToastProvider.");
  return context;
}
