"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/toast-provider";

async function post(url: string) {
  const response = await fetch(url, { method: "POST" });
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(result?.message ?? "Não foi possível atualizar as revisões.");
  return result;
}

export function CompleteReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function complete() {
    setPending(true);
    setError("");
    try {
      const result = await post(`/api/reviews/${reviewId}/complete`);
      notify("success", result.message ?? "Revisão concluída.");
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Tente novamente.";
      setError(message);
      notify("error", message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={complete}
        disabled={pending}
        className="btn-primary min-h-10 px-3 text-xs"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {pending ? "Registrando" : "Concluir revisão"}
      </button>
      {error && <p role="alert" className="mt-1 max-w-44 text-xs text-rose-700">{error}</p>}
    </div>
  );
}

export function PrepareReviewsButton() {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function prepare() {
    setPending(true);
    setMessage("");
    setError("");
    try {
      const result = await post("/api/reviews/prepare");
      setMessage(result.message);
      notify("success", result.message ?? "Agenda preparada.");
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Tente novamente.";
      setError(message);
      notify("error", message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5">
      <button type="button" onClick={prepare} disabled={pending} className="btn-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {pending ? "Preparando agenda" : "Preparar minha agenda"}
      </button>
      {message && <p className="mt-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    </div>
  );
}

export function PostponeReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter(); const { notify } = useToast(); const [pending, setPending] = useState(false);
  async function postpone() { setPending(true); try { const result = await post(`/api/reviews/${reviewId}/postpone`); notify("warning", result.message ?? "Revisão adiada."); router.refresh(); } catch (error) { notify("error", error instanceof Error ? error.message : "Não foi possível adiar a revisão."); } finally { setPending(false); } }
  return <button type="button" onClick={postpone} disabled={pending} className="btn-secondary min-h-10 px-3 text-xs">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />} Adiar</button>;
}
