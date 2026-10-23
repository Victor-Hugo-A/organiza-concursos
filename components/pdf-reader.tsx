"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Loader2,
  Plus,
  Underline,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type Keyword = { id: string; termo: string; origem: string; cor: string };
type Position = { x: number; y: number; width: number; height: number };
type Mark = {
  id: string;
  pagina: number;
  texto: string;
  estilo: "REALCE" | "SUBLINHADO";
  cor: string;
  posicoes: Position[];
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
    throw new Error(result?.message ?? "Não foi possível salvar a marcação.");
  return result;
}

function PdfPage({
  url,
  page,
  marks,
  onSelection,
}: {
  url: string;
  page: number;
  marks: Mark[];
  onSelection: (text: string, positions: Position[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let destroyDocument: (() => Promise<void>) | undefined;
    let textLayer: { cancel: () => void } | undefined;

    async function renderPage() {
      setLoading(true);
      setError("");
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Não foi possível carregar este PDF.");
        const data = new Uint8Array(await response.arrayBuffer());
        const loadingTask = pdfjs.getDocument({ data });
        const pdf = await loadingTask.promise;
        destroyDocument = () => loadingTask.destroy();
        if (cancelled) return;
        const pdfPage = await pdf.getPage(page);
        const viewport = pdfPage.getViewport({ scale: 1.15 });
        const canvas = canvasRef.current;
        const textLayerElement = textLayerRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !textLayerElement || !context) {
          throw new Error("Não foi possível preparar a página do PDF.");
        }
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.ceil(viewport.width * ratio);
        canvas.height = Math.ceil(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        textLayerElement.replaceChildren();
        textLayerElement.style.width = `${viewport.width}px`;
        textLayerElement.style.height = `${viewport.height}px`;
        await pdfPage.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        }).promise;
        if (cancelled) return;
        const textContent = await pdfPage.getTextContent();
        const layer = new pdfjs.TextLayer({
          textContentSource: textContent,
          container: textLayerElement,
          viewport,
        });
        textLayer = layer;
        await layer.render();
        if (!cancelled) setLoading(false);
      } catch (renderError) {
        if (!cancelled) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Erro ao renderizar o PDF.",
          );
          setLoading(false);
        }
      }
    }
    void renderPage();
    return () => {
      cancelled = true;
      textLayer?.cancel();
      void destroyDocument?.();
    };
  }, [page, url]);

  function captureSelection() {
    const layer = textLayerRef.current;
    const selection = window.getSelection();
    if (!layer || !selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    const pageBounds = layer.getBoundingClientRect();
    if (!text || !pageBounds.width || !pageBounds.height) return;
    const positions = Array.from(selection.getRangeAt(0).getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .slice(0, 100)
      .map((rect) => {
        const x = Math.max(
          0,
          Math.min(0.999, (rect.left - pageBounds.left) / pageBounds.width),
        );
        const y = Math.max(
          0,
          Math.min(0.999, (rect.top - pageBounds.top) / pageBounds.height),
        );
        return {
          x,
          y,
          width: Math.max(
            0.001,
            Math.min(1 - x, rect.width / pageBounds.width),
          ),
          height: Math.max(
            0.001,
            Math.min(1 - y, rect.height / pageBounds.height),
          ),
        };
      });
    if (positions.length) onSelection(text.slice(0, 3000), positions);
  }

  return (
    <div className="relative min-h-full overflow-auto p-4">
      {loading && (
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-stone-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando página…
        </p>
      )}
      {error && <p role="alert" className="p-4 text-sm text-rose-700">{error}</p>}
      <div
        className={`relative mx-auto w-fit bg-white shadow-lg ${loading || error ? "hidden" : ""}`}
        style={{ isolation: "isolate" }}
      >
        <canvas ref={canvasRef} className="relative z-0 block" />
        {marks.flatMap((mark) =>
          mark.posicoes.map((position, index) => (
            <span
              key={`${mark.id}-${index}`}
              aria-label={`${mark.estilo === "SUBLINHADO" ? "Sublinhado" : "Realce"}: ${mark.texto}`}
              className={`pdf-mark ${mark.estilo === "SUBLINHADO" ? "pdf-mark-underline" : ""}`}
              style={{
                left: `${position.x * 100}%`,
                top: `${position.y * 100}%`,
                width: `${position.width * 100}%`,
                height: `${position.height * 100}%`,
                backgroundColor: mark.estilo === "REALCE" ? `${mark.cor}99` : "transparent",
                borderColor: mark.cor,
              }}
            />
          )),
        )}
        <div
          ref={textLayerRef}
          className="pdf-text-layer"
          onMouseUp={captureSelection}
          onTouchEnd={captureSelection}
        />
      </div>
    </div>
  );
}

export function PdfReader({
  id,
  title,
  pages,
  currentPage,
  keywords,
  tipo = "PDF",
  onProgressSaved,
}: {
  id: string;
  title: string;
  pages: number | null;
  currentPage: number | null;
  keywords: Keyword[];
  tipo?: "PDF" | "IMAGEM";
  onProgressSaved?: (page: number) => void;
}) {
  const url = `/api/materials/${id}/file`;
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(currentPage ?? 1);
  const [savedPage, setSavedPage] = useState(currentPage ?? 1);
  const [saving, setSaving] = useState(false);
  const [term, setTerm] = useState("");
  const [color, setColor] = useState(highlightColors[0].value);
  const [style, setStyle] = useState<"REALCE" | "SUBLINHADO">("REALCE");
  const [pendingMark, setPendingMark] = useState<{ text: string; positions: Position[] } | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [savingMark, setSavingMark] = useState(false);
  const [savingKeyword, setSavingKeyword] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!open || tipo !== "PDF") return;
    let cancelled = false;
    void fetch(`/api/materials/${id}/marks`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        if (!cancelled) setMarks(result.data as Mark[]);
      })
      .catch((loadError: unknown) => {
        if (!cancelled)
          notify("error", loadError instanceof Error ? loadError.message : "Falha ao carregar marcações.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, open, tipo, notify]);

  async function save(next = page) {
    if (tipo !== "PDF") return;
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
      notify("error", saveError instanceof Error ? saveError.message : "Não foi possível salvar a página.");
    } finally {
      setSaving(false);
    }
  }

  function move(delta: number) {
    const next = Math.max(1, Math.min(pages ?? Number.MAX_SAFE_INTEGER, page + delta));
    setPage(next);
    void save(next);
  }

  async function saveMark() {
    if (!pendingMark || savingMark) return;
    setSavingMark(true);
    try {
      const result = await sendRequest(`/api/materials/${id}/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagina: page,
          texto: pendingMark.text,
          posicoes: pendingMark.positions,
          cor: color,
          estilo: style,
        }),
      });
      setMarks((current) => [...current, result.data as Mark]);
      setPendingMark(null);
      window.getSelection()?.removeAllRanges();
      notify("success", "Marcação salva no PDF.");
    } catch (saveError) {
      notify("error", saveError instanceof Error ? saveError.message : "Não foi possível salvar a marcação.");
    } finally {
      setSavingMark(false);
    }
  }

  async function deleteMark(mark: Mark) {
    try {
      const result = await sendRequest(`/api/materials/${id}/marks/${mark.id}`, { method: "DELETE" });
      setMarks((current) => current.filter((item) => item.id !== mark.id));
      notify("success", result.message);
    } catch (deleteError) {
      notify("error", deleteError instanceof Error ? deleteError.message : "Não foi possível remover a marcação.");
    }
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
      setError(requestError instanceof Error ? requestError.message : "Não foi possível salvar a palavra-chave.");
    } finally {
      setSavingKeyword(false);
    }
  }

  async function updateColor(keyword: Keyword, nextColor: string) {
    try {
      const response = await sendRequest(`/api/materials/${id}/keywords/${keyword.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cor: nextColor }),
      });
      notify("success", response.message);
      router.refresh();
    } catch (requestError) {
      notify("error", requestError instanceof Error ? requestError.message : "Não foi possível atualizar a cor.");
    }
  }

  async function deleteKeyword(keyword: Keyword) {
    try {
      await sendRequest(`/api/materials/${id}/keywords/${keyword.id}`, { method: "DELETE" });
      notify("success", `Palavra-chave “${keyword.termo}” removida.`);
      router.refresh();
    } catch (requestError) {
      notify("error", requestError instanceof Error ? requestError.message : "Não foi possível remover a palavra-chave.");
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
        <Expand className="h-4 w-4" /> Ler no app
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 p-3 sm:p-6">
          <section role="dialog" aria-modal="true" aria-label={`Leitor: ${title}`} className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-950">{title}</p>
                <p className="text-xs text-stone-500">{tipo === "PDF" ? `Página ${page}${pages ? ` de ${pages}` : ""}` : "Visualização da imagem"}</p>
              </div>
              <a href={url} target="_blank" rel="noreferrer" className="btn-secondary text-sm">Abrir em outra aba</a>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" aria-label="Fechar leitor"><X className="h-5 w-5" /></button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <div className="min-h-[45vh] flex-1 overflow-auto bg-stone-100 md:min-h-0">
                {tipo === "PDF" ? (
                  <PdfPage
                    key={page}
                    url={url}
                    page={page}
                    marks={marks.filter((mark) => mark.pagina === page)}
                    onSelection={(text, positions) => setPendingMark({ text, positions })}
                  />
                ) : (
                  <div className="grid min-h-full place-items-center p-4"><img src={url} alt={title} className="max-h-full max-w-full object-contain" /></div>
                )}
              </div>
              <aside className="max-h-[45vh] w-full shrink-0 overflow-y-auto border-t border-stone-200 bg-white p-4 md:max-h-none md:w-80 md:border-l md:border-t-0">
                {tipo === "PDF" && (
                  <>
                    <h2 className="font-semibold text-stone-900">Marcar trecho selecionado</h2>
                    <p className="mt-1 text-xs leading-5 text-stone-500">Selecione um trecho do texto no PDF e escolha realce ou sublinhado.</p>
                    {pendingMark ? (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="max-h-24 overflow-auto whitespace-pre-wrap text-xs text-stone-700">{pendingMark.text}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => setStyle("REALCE")} aria-pressed={style === "REALCE"} className={`btn-secondary flex-1 text-xs ${style === "REALCE" ? "ring-2 ring-emerald-500" : ""}`}>Realçar</button>
                          <button type="button" onClick={() => setStyle("SUBLINHADO")} aria-pressed={style === "SUBLINHADO"} className={`btn-secondary flex-1 text-xs ${style === "SUBLINHADO" ? "ring-2 ring-emerald-500" : ""}`}><Underline className="h-4 w-4" /> Sublinhado</button>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {highlightColors.map((item) => (
                            <button key={item.value} type="button" onClick={() => setColor(item.value)} aria-label={item.name} aria-pressed={color === item.value} className={`h-7 w-7 rounded-full border-2 ${color === item.value ? "border-stone-900" : "border-white shadow"}`} style={{ backgroundColor: item.value }} />
                          ))}
                        </div>
                        <button type="button" onClick={() => void saveMark()} disabled={savingMark} className="btn-primary mt-3 w-full text-sm">{savingMark ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Salvar marcação</button>
                      </div>
                    ) : <p className="mt-3 rounded-xl bg-stone-50 p-3 text-xs text-stone-500">Nenhum trecho selecionado.</p>}
                    <h3 className="mt-5 font-semibold text-stone-900">Marcações desta página</h3>
                    <div className="mt-2 space-y-2">
                      {marks.filter((mark) => mark.pagina === page).map((mark) => (
                        <div key={mark.id} className="flex items-start gap-2 rounded-xl border border-stone-200 p-2">
                          <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: mark.cor }} />
                          <p className="min-w-0 flex-1 text-xs leading-5 text-stone-700">{mark.texto}</p>
                          <button type="button" onClick={() => void deleteMark(mark)} className="text-xs text-rose-700 hover:underline">Excluir</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <h2 className="mt-5 font-semibold text-stone-900">Palavras-chave manuais</h2>
                <form onSubmit={addKeyword} className="mt-3 space-y-3">
                  <label className="block text-sm font-medium text-stone-700">Adicionar palavra ou expressão<input value={term} onChange={(event) => setTerm(event.target.value)} maxLength={80} required className="mt-1.5" placeholder="Ex.: oração subordinada" /></label>
                  <div className="flex flex-wrap gap-2" aria-label="Cor da palavra-chave">
                    {highlightColors.map((item) => <button key={item.value} type="button" onClick={() => setColor(item.value)} aria-label={item.name} aria-pressed={color === item.value} className={`h-7 w-7 rounded-full border-2 ${color === item.value ? "border-stone-900" : "border-white shadow"}`} style={{ backgroundColor: item.value }} />)}
                  </div>
                  <button type="submit" disabled={savingKeyword || !term.trim()} className="btn-secondary w-full text-sm">{savingKeyword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Adicionar palavra-chave</button>
                  {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
                </form>
                <div className="mt-4 space-y-2">
                  {keywords.map((keyword) => (
                    <div key={keyword.id} className="flex items-center gap-2 rounded-xl border border-stone-200 p-2">
                      <span className="min-w-0 flex-1 rounded-lg px-2 py-1 text-sm text-stone-900" style={{ backgroundColor: keyword.cor }}>{keyword.termo}</span>
                      <label className="sr-only" htmlFor={`color-${keyword.id}`}>Mudar cor de {keyword.termo}</label>
                      <select id={`color-${keyword.id}`} aria-label={`Cor de ${keyword.termo}`} value={highlightColors.some((item) => item.value === keyword.cor) ? keyword.cor : highlightColors[0].value} onChange={(event) => void updateColor(keyword, event.target.value)} className="!w-10 !p-1">
                        {highlightColors.map((item) => <option key={item.value} value={item.value}>{item.name}</option>)}
                      </select>
                      <button type="button" onClick={() => void deleteKeyword(keyword)} className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Remover palavra-chave ${keyword.termo}`}>×</button>
                    </div>
                  ))}
                  {!keywords.length && <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">Nenhuma palavra-chave manual cadastrada.</p>}
                </div>
              </aside>
            </div>
            {tipo === "PDF" && (
              <footer className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
                <button type="button" onClick={() => move(-1)} disabled={saving || page <= 1} className="btn-secondary text-sm"><ChevronLeft className="h-4 w-4" />Anterior</button>
                <button type="button" onClick={() => void save()} disabled={saving} className="text-sm font-semibold text-emerald-800">{saving ? <Loader2 className="inline h-4 w-4 animate-spin" /> : savedPage === page ? `Página ${page} salva` : "Salvar página"}</button>
                <button type="button" onClick={() => move(1)} disabled={saving || Boolean(pages && page >= pages)} className="btn-secondary text-sm">Próxima<ChevronRight className="h-4 w-4" /></button>
              </footer>
            )}
          </section>
        </div>
      )}
    </>
  );
}
