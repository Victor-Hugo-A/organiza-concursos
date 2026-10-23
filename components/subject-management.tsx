"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";

type Subject = {
  id: string;
  titulo: string;
  planoId: string;
  topicCount: number;
  materialCount: number;
  questionCount: number;
};

export function SubjectManagement({
  subject,
  onUpdated,
  onDeleted,
}: {
  subject: Subject;
  onUpdated?: () => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [title, setTitle] = useState(subject.titulo);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (pending) return;
    setMode(null);
    setError("");
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");

    try {
      let response: Response;
      try {
        response = await fetch(`/api/subjects/${subject.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo: title }),
        });
      } catch {
        throw new Error(
          "A conexão foi interrompida. Confira sua internet e tente novamente.",
        );
      }
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message ?? "Não foi possível atualizar a matéria.");
      }

      notify("success", `Matéria atualizada para “${title.trim()}”.`);
      setMode(null);
      onUpdated?.();
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

  async function deleteSubject() {
    if (pending) return;
    setPending(true);
    setError("");

    try {
      let response: Response;
      try {
        response = await fetch(`/api/subjects/${subject.id}`, {
          method: "DELETE",
        });
      } catch {
        throw new Error(
          "A conexão foi interrompida. Confira sua internet e tente novamente.",
        );
      }
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message ?? "Não foi possível excluir a matéria.");
      }

      notify(
        "destructive",
        `Matéria excluída: “${subject.titulo}”. Os materiais foram preservados.`,
      );
      setMode(null);
      onDeleted?.();
      router.push(`/app/materiais?plano=${subject.planoId}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir a matéria. Tente novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setTitle(subject.titulo);
            setError("");
            setMode("edit");
          }}
          className="btn-secondary text-sm"
        >
          <Pencil className="h-4 w-4" />
          Editar matéria
        </button>
        <button
          type="button"
          onClick={() => {
            setError("");
            setMode("delete");
          }}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </button>
      </div>

      {mode && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-stone-950/40 p-5 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (!pending && event.target === event.currentTarget) close();
          }}
        >
          <section
            role={mode === "delete" ? "alertdialog" : "dialog"}
            aria-modal="true"
            aria-labelledby="subject-management-title"
            className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                  mode === "delete"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {mode === "delete" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Pencil className="h-5 w-5" />
                )}
              </span>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                aria-label="Fechar janela"
                className="grid h-9 w-9 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {mode === "edit" ? (
              <form onSubmit={submitEdit}>
                <h2
                  id="subject-management-title"
                  className="mt-5 text-xl font-semibold text-stone-950"
                >
                  Editar matéria
                </h2>
                <label className="mt-4 block text-sm font-semibold text-stone-700">
                  Nome da matéria
                  <input
                    autoFocus
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    className="mt-1.5"
                  />
                </label>
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
                    onClick={close}
                    disabled={pending}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="btn-primary"
                  >
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {pending ? "Salvando…" : "Salvar alterações"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2
                  id="subject-management-title"
                  className="mt-5 text-xl font-semibold text-stone-950"
                >
                  Excluir matéria?
                </h2>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Confirme a exclusão permanente de{" "}
                  <strong className="break-words text-stone-900">
                    “{subject.titulo}”
                  </strong>
                  :
                </p>
                <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-stone-700">
                  <p className="font-semibold text-rose-800">
                    Serão excluídos:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>
                      Todos os tópicos e subtópicos cadastrados (
                      {subject.topicCount});
                    </li>
                    <li>
                      {subject.questionCount}{" "}
                      {subject.questionCount === 1
                        ? "questão e suas tentativas"
                        : "questões e suas tentativas"}
                      .
                    </li>
                  </ul>
                </div>
                <p className="mt-4 text-sm leading-6 text-stone-600">
                  <strong className="text-stone-900">
                    {subject.materialCount}{" "}
                    {subject.materialCount === 1
                      ? "material será preservado"
                      : "materiais serão preservados"}
                    .
                  </strong>{" "}
                  Eles e os arquivos anexados continuarão no plano, sem vínculo
                  com esta matéria. Anotações também serão mantidas, sem o
                  vínculo com a matéria ou seus tópicos.
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
                    onClick={close}
                    disabled={pending}
                    className="btn-secondary"
                  >
                    Manter matéria
                  </button>
                  <button
                    type="button"
                    onClick={deleteSubject}
                    disabled={pending}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Excluir matéria
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
