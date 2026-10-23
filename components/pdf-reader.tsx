"use client";

import { FormEvent, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type Keyword = {
  id: string;
  termo: string;
  origem: string;
  cor: string;
};

const highlightColors = [
  { name: "Amarelo", value: "#FEF08A" },
  { name: "Verde", value: "#BBF7D0" },
  { name: "Azul", value: "#BFDBFE" },
  { name: "Rosa", value: "#FBCFE8" },
  { name: "Roxo", value: "#DDD6FE" },
];

async function sendRequest(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(result?.message ?? "Não foi possível salvar o destaque.");
  return result;
}

export function PdfReader({
  id,
  title,
  pages,
  currentPage,
  keywords,
  onProgressSaved,
}: {
  id: string;
  title: string;
  pages: number | null;
  currentPage: number | null;
  keywords: Keyword[];
  onProgressSaved?: (page: number) => void;
}) {
  const url = `/api/materials/${id}/file`;
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(currentPage ?? 1);
  const [savedPage, setSavedPage] = useState(currentPage ?? 1);
  const [saving, setSaving] = useState(false);
  const [term, setTerm] = useState("");
  const [color, setColor] = useState(highlightColors[0].value);
  const [activeKeyword, setActiveKeyword] = useState("");
  const [savingKeyword, setSavingKeyword] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useToast();
  const router = useRouter();
  const readerUrl = `${url}#page=${page}${
    activeKeyword ? `&search=${encodeURIComponent(activeKeyword)}` : ""
  }`;

  async function save(next = page) {
    setSaving(true);
    try {
      const response = await fetch(`/api/materials/${id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paginaAtual: next }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setSavedPage(next);
      onProgressSaved?.(next);
      notify("success", `Página ${next} salva.`);
      router.refresh();
    } catch (saveError) {
      notify(
        "error",
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar a página.",
      );
    } finally {
      setSaving(false);
    }
  }

  function move(delta: number) {
    const next = Math.max(1, Math.min(pages ?? Number.MAX_SAFE_INTEGER, page + delta));
    setPage(next);
    void save(next);
  }

  async function addKeyword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!term.trim() || savingKeyword) return;
    setSavingKeyword(true);
    setError("");
    try {
      const response = await sendRequest(`/api/materials/${id}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termo: term.trim(), cor: color }),
      });
      setTerm("");
      notify("success", response.message);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível salvar a palavra-chave.",
      );
    } finally {
      setSavingKeyword(false);
    }
  }

  async function updateColor(keyword: Keyword, nextColor: string) {
    try {
      const response = await sendRequest(
        `/api/materials/${id}/keywords/${keyword.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cor: nextColor }),
        },
      );
      notify("success", response.message);
      router.refresh();
    } catch (requestError) {
      notify(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível atualizar a cor.",
      );
    }
  }

  async function deleteKeyword(keyword: Keyword) {
    try {
      await sendRequest(`/api/materials/${id}/keywords/${keyword.id}`, {
        method: "DELETE",
      });
      notify("success", `Destaque “${keyword.termo}” removido.`);
      router.refresh();
    } catch (requestError) {
      notify(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível remover o destaque.",
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary text-sm"
      >
        <Expand className="h-4 w-4" /> Ler no app
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 p-3 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Leitor: ${title}`}
            className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-950">{title}</p>
                <p className="text-xs text-stone-500">
                  Página {page}
                  {pages ? ` de ${pages}` : ""}
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-sm"
              >
                Abrir em outra aba
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                aria-label="Fechar leitor"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <div className="min-h-[45vh] flex-1 bg-stone-100 md:min-h-0">
                <iframe
                  key={page}
                  src={readerUrl}
                  title={title}
                  className="h-full min-h-[45vh] w-full border-0 md:min-h-0"
                />
              </div>
              <aside className="max-h-[45vh] w-full shrink-0 overflow-y-auto border-t border-stone-200 bg-white p-4 md:max-h-none md:w-80 md:border-l md:border-t-0">
                <h2 className="font-semibold text-stone-900">Palavras em destaque</h2>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  Clique em um termo para procurá-lo no leitor do navegador.
                  As cores identificam suas marcações.
                </p>
                <form onSubmit={addKeyword} className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-stone-700">
                    Adicionar palavra ou expressão
                    <input
                      value={term}
                      onChange={(event) => setTerm(event.target.value)}
                      maxLength={80}
                      required
                      className="mt-1.5"
                      placeholder="Ex.: oração subordinada"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2" aria-label="Cor do destaque">
                    {highlightColors.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setColor(item.value)}
                        aria-label={item.name}
                        aria-pressed={color === item.value}
                        className={`h-8 w-8 rounded-full border-2 ${
                          color === item.value
                            ? "border-stone-900 ring-2 ring-stone-300"
                            : "border-white shadow"
                        }`}
                        style={{ backgroundColor: item.value }}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={savingKeyword || !term.trim()}
                    className="btn-primary w-full text-sm"
                  >
                    {savingKeyword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Adicionar destaque
                  </button>
                  {error && (
                    <p role="alert" className="text-xs text-rose-700">
                      {error}
                    </p>
                  )}
                </form>
                <div className="mt-5 space-y-2">
                  {!keywords.length ? (
                    <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
                      Nenhuma palavra-chave identificada ou adicionada ainda.
                    </p>
                  ) : (
                    keywords.map((keyword) => (
                      <div
                        key={keyword.id}
                        className={`flex items-center gap-2 rounded-xl border p-2 ${
                          activeKeyword === keyword.termo
                            ? "border-emerald-500 ring-1 ring-emerald-300"
                            : "border-stone-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setActiveKeyword((current) =>
                              current === keyword.termo ? "" : keyword.termo,
                            )
                          }
                          className="min-w-0 flex-1 rounded-lg px-2 py-1 text-left text-sm font-medium text-stone-900"
                          style={{ backgroundColor: keyword.cor }}
                          aria-pressed={activeKeyword === keyword.termo}
                          title="Procurar esta expressão no PDF"
                        >
                          {keyword.termo}
                        </button>
                        <label className="sr-only" htmlFor={`color-${keyword.id}`}>
                          Mudar cor de {keyword.termo}
                        </label>
                        <select
                          id={`color-${keyword.id}`}
                          aria-label={`Cor de ${keyword.termo}`}
                          value={
                            highlightColors.some((item) => item.value === keyword.cor)
                              ? keyword.cor
                              : highlightColors[0].value
                          }
                          onChange={(event) =>
                            void updateColor(keyword, event.target.value)
                          }
                          className="!w-10 !p-1"
                        >
                          {highlightColors.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void deleteKeyword(keyword)}
                          className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Remover destaque ${keyword.termo}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            </div>
            <footer className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
              <button
                type="button"
                onClick={() => move(-1)}
                disabled={saving || page <= 1}
                className="btn-secondary text-sm"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="text-sm font-semibold text-emerald-800"
              >
                {saving ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : savedPage === page ? (
                  `Página ${page} salva`
                ) : (
                  "Salvar página"
                )}
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                disabled={saving || Boolean(pages && page >= pages)}
                className="btn-secondary text-sm"
              >
                Próxima <ChevronRight className="h-4 w-4" />
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
