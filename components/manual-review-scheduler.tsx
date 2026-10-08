"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type ReviewMoment = "AMANHA" | "SETE_DIAS" | "TRINTA_DIAS" | "PERSONALIZADA";

const choices: { value: ReviewMoment; label: string; description: string }[] = [
  { value: "AMANHA", label: "Amanhã", description: "retome enquanto está recente" },
  { value: "SETE_DIAS", label: "7 dias", description: "confirme os conceitos" },
  { value: "TRINTA_DIAS", label: "30 dias", description: "consolide no longo prazo" },
  { value: "PERSONALIZADA", label: "Outra data", description: "escolha no calendário" },
];

export function ManualReviewScheduler({
  materials,
}: {
  materials: { id: string; titulo: string; materia: { titulo: string } | null }[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [when, setWhen] = useState<ReviewMoment>("AMANHA");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: form.get("materialId"),
          quando: when,
          dataPersonalizada: when === "PERSONALIZADA" ? form.get("dataPersonalizada") : undefined,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Não foi possível agendar a revisão.");
      notify("success", result.message ?? "Revisão agendada.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Não foi possível agendar a revisão.");
    } finally {
      setPending(false);
    }
  }

  if (!materials.length) return null;

  return (
    <section className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-900">Revisão manual</p>
          <p className="mt-1 text-sm leading-6 text-stone-600">Agende o retorno de qualquer material para o momento que fizer sentido no seu plano.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="btn-primary">
          <CalendarPlus className="h-4 w-4" /> Agendar revisão
        </button>
      </div>
      {open && (
        <form onSubmit={submit} className="mt-5 border-t border-emerald-100 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Material
              <select name="materialId" className="mt-1.5" required>
                {materials.map((material) => <option key={material.id} value={material.id}>{material.materia?.titulo ? `${material.materia.titulo} · ${material.titulo}` : material.titulo}</option>)}
              </select>
            </label>
            {when === "PERSONALIZADA" && <label>Data da revisão<input name="dataPersonalizada" type="date" min={today} required className="mt-1.5" /></label>}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {choices.map((choice) => <button key={choice.value} type="button" onClick={() => setWhen(choice.value)} className={`rounded-2xl border p-4 text-left transition ${when === choice.value ? "border-emerald-500 bg-white ring-2 ring-emerald-100" : "border-emerald-100 bg-white/60 hover:border-emerald-300"}`}><p className="font-semibold text-stone-950">{choice.label}</p><p className="mt-1 text-xs leading-5 text-stone-500">{choice.description}</p></button>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-3"><button disabled={pending} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar agendamento</button><button type="button" onClick={() => setOpen(false)} disabled={pending} className="btn-secondary">Cancelar</button></div>
        </form>
      )}
    </section>
  );
}
