"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

export function PlanCreator() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: form.get("titulo"), tipo: form.get("tipo") })
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message ?? "Não foi possível criar o plano.");
      setPending(false);
      return;
    }
    setOpen(false);
    setPending(false);
    router.refresh();
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="h-4 w-4" /> Criar plano</button>;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/35 p-5 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-emerald-800">Novo caminho</p><h2 className="text-2xl font-semibold text-stone-950">Criar plano</h2></div><button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-600"><X className="h-4 w-4" /></button></div>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}<div className="mt-6 grid gap-4"><label>Nome do objetivo<input name="titulo" required minLength={2} className="mt-1.5" placeholder="Ex.: ENEM 2027" /></label><label>Tipo<select name="tipo" className="mt-1.5"><option value="ENEM">ENEM</option><option value="PAS">PAS</option><option value="CONCURSO_PUBLICO">Concurso público</option><option value="VESTIBULAR">Vestibular</option><option value="OUTRO">Outro</option></select></label><button disabled={pending} className="btn-primary mt-2">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar plano"}</button></div></form></div>;
}
