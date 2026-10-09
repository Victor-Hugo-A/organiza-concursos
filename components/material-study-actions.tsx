"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type ActiveSession = { id: string; iniciadaEm: string };
type Difficulty = "FACIL" | "MEDIO" | "DIFICIL";

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

async function requestJson(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message ?? "Não foi possível concluir esta ação.");
  return result;
}

export function MaterialStudyActions({
  material,
  onProgressSaved,
}: {
  material: {
    id: string;
    titulo: string;
    paginas: number | null;
    paginaAtual: number | null;
    concluidoEm: string | null;
    activeSession: ActiveSession | null;
  };
  onProgressSaved?: (page: number) => void;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [session, setSession] = useState<ActiveSession | null>(material.activeSession);
  const [elapsed, setElapsed] = useState(() =>
    material.activeSession
      ? Math.max(0, Math.floor((Date.now() - new Date(material.activeSession.iniciadaEm).getTime()) / 1000))
      : 0,
  );
  const [paused, setPaused] = useState(false);
  const [pending, setPending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIO");
  const [page, setPage] = useState(material.paginaAtual?.toString() ?? "");
  const [savedPage, setSavedPage] = useState(material.paginaAtual);

  useEffect(() => {
    if (!session || paused) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [session, paused]);

  async function start() {
    setPending(true);
    try {
      const result = await requestJson("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: material.id }),
      });
      const nextSession = result.data as { id: string; iniciadaEm: string };
      setSession(nextSession);
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(nextSession.iniciadaEm).getTime()) / 1000)));
      setPaused(false);
      notify("success", "Sessão de estudo iniciada.");
      router.refresh();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Não foi possível iniciar a sessão.");
    } finally {
      setPending(false);
    }
  }

  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setPending(true);
    try {
      const result = await requestJson(`/api/study-sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duracaoSegundos: Math.max(1, elapsed),
          dificuldade: difficulty,
        }),
      });
      notify("success", result.message ?? "Sessão finalizada e registrada.");
      setSession(null);
      setFinishing(false);
      setPaused(false);
      router.refresh();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Não foi possível finalizar a sessão.");
    } finally {
      setPending(false);
    }
  }

  async function saveProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!page) return;
    setPending(true);
    try {
      const result = await requestJson(`/api/materials/${material.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paginaAtual: Number(page) }),
      });
      notify("success", result.message ?? "Progresso salvo.");
      setSavedPage(Number(page));
      onProgressSaved?.(Number(page));
      router.refresh();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Não foi possível salvar o progresso.");
    } finally {
      setPending(false);
    }
  }

  async function toggleCompletion() {
    setPending(true);
    try {
      const result = await requestJson(`/api/materials/${material.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluido: !material.concluidoEm }),
      });
      notify(
        "success",
        result.message ?? (material.concluidoEm ? "Material reaberto." : "Material concluído."),
      );
      router.refresh();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Não foi possível atualizar o material.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-emerald-800" />
          <p className="text-sm font-semibold text-stone-900">Sessão de estudo</p>
        </div>
        {session && <span className="font-mono text-lg font-semibold tabular-nums text-emerald-950">{formatDuration(elapsed)}</span>}
      </div>

      {!session ? (
        <button type="button" onClick={start} disabled={pending} className="btn-primary mt-3 text-sm">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Iniciar estudo
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setPaused((value) => !value)} disabled={pending} className="btn-secondary text-sm">
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {paused ? "Retomar" : "Pausar"}
          </button>
          <button type="button" onClick={() => setFinishing((value) => !value)} disabled={pending} className="btn-primary text-sm">
            <CheckCircle2 className="h-4 w-4" /> Finalizar
          </button>
        </div>
      )}

      {finishing && session && (
        <form onSubmit={finish} className="mt-4 border-t border-emerald-100 pt-4">
          <p className="text-sm text-stone-600">Tempo estudado: <strong className="text-stone-900">{formatDuration(elapsed)}</strong></p>
          <label className="mt-3 block text-sm font-semibold text-stone-700">
            Como foi a dificuldade?
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="mt-1.5">
              <option value="FACIL">Fácil</option>
              <option value="MEDIO">Médio</option>
              <option value="DIFICIL">Difícil</option>
            </select>
          </label>
          <button disabled={pending} className="btn-primary mt-3 text-sm">Registrar sessão</button>
        </form>
      )}

      <div className="mt-4 border-t border-emerald-100 pt-4">
        {material.paginas && (
          <form onSubmit={saveProgress} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-semibold text-stone-700">
              Página atual <span className="font-normal text-stone-500">{savedPage ?? "não informada"} de {material.paginas}</span>
              <input value={page} onChange={(event) => setPage(event.target.value.replace(/\D/g, ""))} inputMode="numeric" className="mt-1.5" placeholder="Ex.: 34" />
            </label>
            <button disabled={pending || !page} className="btn-secondary text-sm">Salvar página</button>
          </form>
        )}
        <button type="button" onClick={toggleCompletion} disabled={pending} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950">
          {material.concluidoEm ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {material.concluidoEm ? "Marcar como em andamento" : "Marcar material como concluído"}
        </button>
      </div>
    </section>
  );
}
