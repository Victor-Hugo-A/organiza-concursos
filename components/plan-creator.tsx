"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

type CreatePlanResponse = {
  message?: string;
  data?: { id?: string };
};

export function PlanCreator() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<() => void>(() => undefined);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (!pending) setOpen(false);
  }

  useEffect(() => {
    closeRef.current = () => {
      if (!pending) setOpen(false);
    };
  }, [pending]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: form.get("titulo"), tipo: form.get("tipo") }),
      });
      const result = (await response.json().catch(() => null)) as CreatePlanResponse | null;
      if (!response.ok || !result?.data?.id) {
        setError(result?.message ?? "Não foi possível criar o plano.");
        return;
      }
      setOpen(false);
      router.push(`/app/materiais?plano=${result.data.id}`);
      router.refresh();
    } catch {
      setError("A conexão foi interrompida. Confira sua internet e tente criar o plano novamente.");
    } finally {
      setPending(false);
    }
  }

  function closeOnBackdrop(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) close();
  }

  function preventSubmitOnEnter(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter") event.preventDefault();
  }

  if (!open) {
    return (
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary"
        aria-haspopup="dialog"
      >
        <Plus className="h-4 w-4" /> Criar plano
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-stone-950/35 p-5 backdrop-blur-sm"
      onMouseDown={closeOnBackdrop}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-plan-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <form onSubmit={submit}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Novo plano de estudo</p>
              <h2 id="create-plan-title" className="text-2xl font-semibold text-stone-950">
                Criar plano
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              onKeyDown={preventSubmitOnEnter}
              disabled={pending}
              aria-label="Fechar criação de plano"
              className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-600 transition hover:bg-stone-200 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}
          <div className="mt-6 grid gap-4">
            <label>
              Nome do plano
              <input name="titulo" required minLength={2} maxLength={100} className="mt-1.5" placeholder="Ex.: ENEM 2027" />
            </label>
            <label>
              Tipo
              <select name="tipo" className="mt-1.5">
                <option value="ENEM">ENEM</option>
                <option value="PAS">PAS</option>
                <option value="CONCURSO_PUBLICO">Concurso público</option>
                <option value="VESTIBULAR">Vestibular</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>
            <button disabled={pending} className="btn-primary mt-2">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar plano"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
