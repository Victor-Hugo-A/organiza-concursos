"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChevronRight, FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export type StudyTopic = {
  id: string;
  titulo: string;
  topicoPaiId: string | null;
};

type TopicManagerProps = {
  materiaId: string;
  topics: StudyTopic[];
  materialCountByTopic: Record<string, number>;
};

async function requestJson(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message ?? "Não foi possível concluir esta ação.");
  }

  return result;
}

export function TopicManager({
  materiaId,
  topics,
  materialCountByTopic,
}: TopicManagerProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const roots = useMemo(
    () => topics.filter((topic) => !topic.topicoPaiId),
    [topics],
  );
  const childrenByParent = useMemo(() => {
    return topics.reduce<Record<string, StudyTopic[]>>((groups, topic) => {
      if (!topic.topicoPaiId) return groups;
      groups[topic.topicoPaiId] = [...(groups[topic.topicoPaiId] ?? []), topic];
      return groups;
    }, {});
  }, [topics]);

  async function createTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await requestJson("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiaId,
          titulo: form.get("titulo"),
          topicoPaiId: form.get("topicoPaiId") || null,
        }),
      });
      event.currentTarget.reset();
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível criar o tópico.",
      );
    } finally {
      setPending(false);
    }
  }

  async function updateTopic(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await requestJson(`/api/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: new FormData(event.currentTarget).get("titulo") }),
      });
      setEditingId("");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível atualizar o tópico.",
      );
    } finally {
      setPending(false);
    }
  }

  async function deleteTopic(topic: StudyTopic) {
    const children = childrenByParent[topic.id]?.length ?? 0;
    const message = children
      ? `Excluir “${topic.titulo}” e seus ${children} subtópico(s)? Os materiais permanecerão nesta matéria, sem tópico.`
      : `Excluir “${topic.titulo}”? Os materiais permanecerão nesta matéria, sem tópico.`;
    if (!window.confirm(message)) return;

    setPending(true);
    setError("");
    try {
      await requestJson(`/api/topics/${topic.id}`, { method: "DELETE" });
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível excluir o tópico.",
      );
    } finally {
      setPending(false);
    }
  }

  function topicRow(topic: StudyTopic, nested = false) {
    const isEditing = editingId === topic.id;
    const materials = materialCountByTopic[topic.id] ?? 0;
    return (
      <li key={topic.id} className={nested ? "ml-4 border-l border-stone-200 pl-4" : ""}>
        {isEditing ? (
          <form onSubmit={(event) => updateTopic(event, topic.id)} className="flex flex-wrap gap-2">
            <input
              name="titulo"
              defaultValue={topic.titulo}
              minLength={2}
              maxLength={100}
              required
              className="min-w-0 flex-1"
              aria-label="Nome do tópico"
            />
            <button disabled={pending} className="btn-primary text-sm">
              Salvar
            </button>
            <button type="button" disabled={pending} onClick={() => setEditingId("")} className="btn-secondary text-sm">
              Cancelar
            </button>
          </form>
        ) : (
          <div className="flex min-w-0 items-center gap-3 rounded-xl py-2">
            {nested && <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">{topic.titulo}</span>
            <span className="hidden items-center gap-1 text-xs text-stone-500 sm:flex">
              <FileText className="h-3.5 w-3.5" /> {materials}
            </span>
            <button type="button" onClick={() => setEditingId(topic.id)} disabled={pending} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900" aria-label={`Editar ${topic.titulo}`}>
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => deleteTopic(topic)} disabled={pending} className="rounded-lg p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`Excluir ${topic.titulo}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        {(childrenByParent[topic.id] ?? []).map((child) => topicRow(child, true))}
      </li>
    );
  }

  return (
    <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-800">Estrutura da disciplina</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-950">Tópicos de estudo</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            Divida a matéria em assuntos e subtópicos. Depois, associe cada PDF ao ponto que ele aborda.
          </p>
        </div>
        <span className="badge">{topics.length} {topics.length === 1 ? "tópico" : "tópicos"}</span>
      </div>

      <form onSubmit={createTopic} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label>
          <span className="sr-only">Nome do tópico</span>
          <input name="titulo" required minLength={2} maxLength={100} placeholder="Ex.: Funções de 1º grau" />
        </label>
        <label>
          <span className="sr-only">Tópico principal</span>
          <select name="topicoPaiId" defaultValue="">
            <option value="">Tópico principal</option>
            {roots.map((topic) => <option key={topic.id} value={topic.id}>Subtópico de: {topic.titulo}</option>)}
          </select>
        </label>
        <button disabled={pending} className="btn-primary sm:self-end">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p>}

      {roots.length ? (
        <ul className="mt-5 divide-y divide-stone-100 border-t border-stone-100">{roots.map((topic) => topicRow(topic))}</ul>
      ) : (
        <p className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-600">
          Ainda não há tópicos. Você pode começar por um capítulo, assunto ou habilidade da matéria.
        </p>
      )}
    </section>
  );
}
