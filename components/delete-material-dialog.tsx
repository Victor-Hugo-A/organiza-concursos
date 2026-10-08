"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

export function DeleteMaterialDialog({
  material,
  pending,
  onCancel,
  onConfirm,
}: {
  material: { id: string; titulo: string } | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!material) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-stone-950/40 p-5 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (!pending && event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-material-title"
        aria-describedby="delete-material-description"
        className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            aria-label="Fechar confirmação"
            className="grid h-9 w-9 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 id="delete-material-title" className="mt-5 text-xl font-semibold text-stone-950">
          Excluir material?
        </h2>
        <p id="delete-material-description" className="mt-3 text-sm leading-6 text-stone-600">
          Você está prestes a excluir <strong className="break-words text-stone-900">“{material.titulo}”</strong>.
          O arquivo, o resumo, as palavras-chave, o progresso e o histórico de estudo vinculados serão removidos definitivamente.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={pending} className="btn-secondary">
            Manter material
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir definitivamente
          </button>
        </div>
      </section>
    </div>
  );
}
