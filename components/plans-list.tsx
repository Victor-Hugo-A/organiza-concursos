"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  GraduationCap,
  Landmark,
  Loader2,
  Scale,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

const typeLabels = {
  ENEM: "ENEM",
  PAS: "PAS",
  CONCURSO_PUBLICO: "Concurso público",
  VESTIBULAR: "Vestibular",
  OUTRO: "Outro objetivo",
};

type Plan = {
  id: string;
  titulo: string;
  tipo: keyof typeof typeLabels;
  atualizadoEm: Date;
  _count: { materias: number; materiais: number };
};

function PlanIcon({ title, type }: { title: string; type: Plan["tipo"] }) {
  const value = title.toLowerCase();
  const Icon = value.includes("inss")
    ? Landmark
    : value.includes("banco") || value.includes("bb")
      ? Building2
      : value.includes("enem") ||
          type === "ENEM" ||
          type === "VESTIBULAR" ||
          type === "PAS"
        ? GraduationCap
        : type === "CONCURSO_PUBLICO"
          ? Scale
          : Target;

  return (
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-white">
      <Icon className="h-6 w-6" />
    </span>
  );
}

export function PlansList({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function deletePlan() {
    if (!deleteTarget || pending) return;
    setPending(true);
    setError("");

    try {
      let response: Response;
      try {
        response = await fetch(`/api/plans/${deleteTarget.id}`, {
          method: "DELETE",
        });
      } catch {
        throw new Error(
          "A conexão foi interrompida. Confira sua internet e tente novamente.",
        );
      }
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message ?? "Não foi possível excluir o plano.");
      }

      notify(
        "destructive",
        `Plano excluído: “${deleteTarget.titulo}”. Esta ação não pode ser desfeita.`,
      );
      setDeleteTarget(null);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "A conexão foi interrompida. Confira sua internet e tente novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="overflow-hidden rounded-3xl border border-stone-200 bg-white"
          >
            <div className="bg-emerald-900 p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">
                  <Target className="h-4 w-4" /> {typeLabels[plan.tipo]}
                </span>
                <PlanIcon title={plan.titulo} type={plan.tipo} />
              </div>
              <h2 className="mt-8 text-2xl font-semibold tracking-tight">
                {plan.titulo}
              </h2>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-900">
                    {plan._count.materias}{" "}
                    {plan._count.materias === 1
                      ? "matéria cadastrada"
                      : "matérias cadastradas"}
                  </span>
                  <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-sm font-medium text-stone-700">
                    {plan._count.materiais}{" "}
                    {plan._count.materiais === 1
                      ? "PDF organizado"
                      : "PDFs organizados"}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Última alteração:{" "}
                  {new Intl.DateTimeFormat("pt-BR").format(plan.atualizadoEm)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/app/materiais?plano=${plan.id}`}
                  className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800"
                >
                  Abrir matérias <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setDeleteTarget(plan);
                  }}
                  aria-label={`Excluir plano ${plan.titulo}`}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-stone-950/40 p-5 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (!pending && event.target === event.currentTarget) {
              setDeleteTarget(null);
              setError("");
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-plan-title"
            aria-describedby="delete-plan-description"
            className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                <Trash2 className="h-5 w-5" />
              </span>
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setError("");
                }}
                disabled={pending}
                aria-label="Fechar confirmação"
                className="grid h-9 w-9 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2
              id="delete-plan-title"
              className="mt-5 text-xl font-semibold text-stone-950"
            >
              Excluir plano de estudo?
            </h2>
            <p
              id="delete-plan-description"
              className="mt-3 text-sm leading-6 text-stone-600"
            >
              Confirme a exclusão permanente do plano{" "}
              <strong className="break-words text-stone-900">
                “{deleteTarget.titulo}”
              </strong>
              :
            </p>
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-stone-700">
              <p className="font-semibold text-rose-800">
                Serão excluídos:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>matérias, tópicos, materiais e arquivos anexados;</li>
                <li>progresso, revisões e histórico de estudo vinculados.</li>
              </ul>
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-600">
              <strong className="text-stone-900">Anotações:</strong> serão
              mantidas, mas deixarão de aparecer associadas a este plano.
            </p>
            <p className="mt-3 text-sm font-semibold text-rose-700">
              Esta ação não pode ser desfeita.
            </p>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
              >
                {error}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setError("");
                }}
                disabled={pending}
                className="btn-secondary"
              >
                Manter plano
              </button>
              <button
                type="button"
                onClick={deletePlan}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Excluir plano e conteúdo
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
