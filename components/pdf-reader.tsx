"use client";

import {
  FormEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Loader2,
  Paintbrush,
  Plus,
  Underline,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type Keyword = { id: string; termo: string; origem: string; cor: string };
type Position = {
  x: number;
  y: number;
  width: number;
  height: number;
  redondo?: boolean;
};
type Mark = {
  id: string;
  pagina: number;
  texto: string;
  estilo: "REALCE" | "SUBLINHADO";
  cor: string;
  opacidade: number;
  posicoes: Position[];
};

const highlightColors = [
  { name: "Amarelo", value: "#FEF08A" },
  { name: "Verde", value: "#BBF7D0" },
  { name: "Azul", value: "#BFDBFE" },
  { name: "Rosa", value: "#FBCFE8" },
  { name: "Roxo", value: "#DDD6FE" },
];

const highlightIntensities = [
  { name: "Suave", value: 0.08 },
  { name: "Leve", value: 0.14 },
  { name: "Médio", value: 0.22 },
  { name: "Forte", value: 0.32 },
];

function translucentColor(color: string, opacity = 0.14) {
  if (!/^#[\da-f]{6}$/i.test(color)) return color;
  return `${color}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

function ColorPicker({
  color,
  onChange,
  label,
}: {
  color: string;
  onChange: (color: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={label}>
      {highlightColors.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          aria-label={item.name}
          aria-pressed={color === item.value}
          className={`h-7 w-7 rounded-full border-2 ${color === item.value ? "border-stone-900" : "border-white shadow"}`}
          style={{ backgroundColor: item.value }}
        />
      ))}
      <label
        className="relative inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border-2 border-stone-900 bg-white px-1.5 text-[10px] font-semibold text-stone-700 shadow"
        title="Escolher cor personalizada"
      >
        <span className="h-4 w-4 rounded-full border border-stone-300" style={{ backgroundColor: color }} />
        <span>Paleta</span>
        <input
          type="color"
          value={color}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label="Escolher cor personalizada"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

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
  brushEnabled,
  draftPositions,
  draftColor,
  draftStyle,
  draftOpacity,
  brushSize,
  onSelection,
}: {
  url: string;
  page: number;
  marks: Mark[];
  brushEnabled: boolean;
  draftPositions: Position[];
  draftColor: string;
  draftStyle: "REALCE" | "SUBLINHADO";
  draftOpacity: number;
  brushSize: number;
  onSelection: (text: string, positions: Position[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const strokePositions = useRef<Position[]>([]);
  const strokeWords = useRef(new Set<string>());
  const lastStrokePoint = useRef<{ x: number; y: number } | null>(null);
  const activePointer = useRef<number | null>(null);
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

  function paintTextAt(event: PointerEvent<HTMLDivElement>) {
    const layer = textLayerRef.current;
    if (!layer || !layer.clientWidth || !layer.clientHeight) return;
    const pageBounds = layer.getBoundingClientRect();
    if (!pageBounds.width || !pageBounds.height) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const textSpan = target?.closest("span");
    if (textSpan && layer.contains(textSpan)) {
      const text = (textSpan.textContent ?? "").trim();
      if (text) strokeWords.current.add(text);
    }
    const point = {
      x: Math.max(0, Math.min(pageBounds.width, event.clientX - pageBounds.left)),
      y: Math.max(0, Math.min(pageBounds.height, event.clientY - pageBounds.top)),
    };
    const radius = brushSize / 2;
    const addDab = (x: number, y: number) => {
      if (strokePositions.current.length >= 2000) return;
      const centerX = Math.max(radius, Math.min(pageBounds.width - radius, x));
      const centerY = Math.max(radius, Math.min(pageBounds.height - radius, y));
      const width = Math.min(brushSize, pageBounds.width);
      const height = Math.min(brushSize, pageBounds.height);
      strokePositions.current.push({
        x: (centerX - width / 2) / pageBounds.width,
        y: (centerY - height / 2) / pageBounds.height,
        width: width / pageBounds.width,
        height: height / pageBounds.height,
        redondo: true,
      });
    };
    const previous = lastStrokePoint.current;
    if (!previous) {
      addDab(point.x, point.y);
    } else {
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
      const step = Math.max(2, brushSize * 0.4);
      const steps = Math.max(1, Math.ceil(distance / step));
      for (let index = 1; index <= steps; index += 1) {
        const progress = index / steps;
        addDab(
          previous.x + (point.x - previous.x) * progress,
          previous.y + (point.y - previous.y) * progress,
        );
      }
    }
    lastStrokePoint.current = point;
    onSelection(
      [...strokeWords.current].join(" ").slice(0, 3000) || "Marcação livre",
      [...strokePositions.current],
    );
  }

  function clearStroke() {
    strokePositions.current = [];
    strokeWords.current.clear();
    lastStrokePoint.current = null;
  }

  function startBrush(event: PointerEvent<HTMLDivElement>) {
    if (!brushEnabled || event.button !== 0) return;
    event.preventDefault();
    clearStroke();
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    paintTextAt(event);
  }

  function moveBrush(event: PointerEvent<HTMLDivElement>) {
    if (!brushEnabled || activePointer.current !== event.pointerId) return;
    paintTextAt(event);
  }

  function finishBrush(event: PointerEvent<HTMLDivElement>) {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    lastStrokePoint.current = null;
    if (!strokePositions.current.length) clearStroke();
  }

  const savedMarkBoxes = marks.flatMap((mark) =>
    mark.posicoes.map((position, index) => (
      <span
        key={`${mark.id}-${index}`}
        aria-label={`${mark.estilo === "SUBLINHADO" ? "Sublinhado" : "Realce"}: ${mark.texto}`}
        className={`pdf-mark ${position.redondo ? "pdf-mark-round" : ""} ${mark.estilo === "SUBLINHADO" ? "pdf-mark-underline" : ""}`}
        style={{
          left: `${position.x * 100}%`,
          top: `${position.y * 100}%`,
          width: `${position.width * 100}%`,
          height: `${position.height * 100}%`,
          backgroundColor:
            mark.estilo === "REALCE"
              ? translucentColor(mark.cor, mark.opacidade ?? 0.14)
              : "transparent",
          borderColor: mark.cor,
        }}
      />
    )),
  );

  const draftMarkBoxes = draftPositions.map((position, index) => (
    <span
      key={`draft-${index}`}
      aria-hidden="true"
      className={`pdf-mark ${position.redondo ? "pdf-mark-round" : ""} ${draftStyle === "SUBLINHADO" ? "pdf-mark-underline" : ""}`}
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        width: `${position.width * 100}%`,
        height: `${position.height * 100}%`,
        backgroundColor:
          draftStyle === "REALCE"
              ? translucentColor(draftColor, draftOpacity)
            : "transparent",
        borderColor: draftColor,
      }}
    />
  ));

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
        {[...savedMarkBoxes, ...draftMarkBoxes]}
        <div
          ref={textLayerRef}
          className={`pdf-text-layer ${brushEnabled ? "pdf-brush-active" : ""}`}
          onPointerDown={startBrush}
          onPointerMove={moveBrush}
          onPointerUp={finishBrush}
          onPointerCancel={finishBrush}
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
  const [opacity, setOpacity] = useState(0.14);
  const [style, setStyle] = useState<"REALCE" | "SUBLINHADO">("REALCE");
  const [brushSize, setBrushSize] = useState(12);
  const [pendingMark, setPendingMark] = useState<{ text: string; positions: Position[] } | null>(null);
  const [brushEnabled, setBrushEnabled] = useState(false);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [savingMark, setSavingMark] = useState(false);
  const [updatingMarkId, setUpdatingMarkId] = useState<string | null>(null);
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
    setPendingMark(null);
    setPage(next);
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
          opacidade: opacity,
          estilo: style,
        }),
      });
      setMarks((current) => [...current, result.data as Mark]);
      setPendingMark(null);
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

  async function updateMark(
    mark: Mark,
    changes: Partial<Pick<Mark, "cor" | "opacidade">>,
  ) {
    if (updatingMarkId) return;
    setUpdatingMarkId(mark.id);
    try {
      const result = await sendRequest(`/api/materials/${id}/marks/${mark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      setMarks((current) =>
        current.map((item) => (item.id === mark.id ? (result.data as Mark) : item)),
      );
      notify("success", "Marcação atualizada.");
    } catch (updateError) {
      notify(
        "error",
        updateError instanceof Error ? updateError.message : "Não foi possível atualizar a marcação.",
      );
    } finally {
      setUpdatingMarkId(null);
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
                    brushEnabled={brushEnabled}
                    draftPositions={pendingMark?.positions ?? []}
                    draftColor={color}
                    draftStyle={style}
                    draftOpacity={opacity}
                    brushSize={brushSize}
                    onSelection={(text, positions) => setPendingMark({ text, positions })}
                  />
                ) : (
                  <div className="grid min-h-full place-items-center p-4"><img src={url} alt={title} className="max-h-full max-w-full object-contain" /></div>
                )}
              </div>
              <aside className="max-h-[45vh] w-full shrink-0 overflow-y-auto border-t border-stone-200 bg-white p-4 md:max-h-none md:w-80 md:border-l md:border-t-0">
                {tipo === "PDF" && (
                  <>
                    <h2 className="font-semibold text-stone-900">Pincel de marcação</h2>
                    <p className="mt-1 text-xs leading-5 text-stone-500">Escolha a espessura e a cor. Depois, arraste com o botão esquerdo para pintar só o caminho feito pelo pincel.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setStyle("REALCE")} aria-pressed={style === "REALCE"} className={`btn-secondary text-xs ${style === "REALCE" ? "ring-2 ring-emerald-500" : ""}`}>Realçar</button>
                      <button type="button" onClick={() => setStyle("SUBLINHADO")} aria-pressed={style === "SUBLINHADO"} className={`btn-secondary text-xs ${style === "SUBLINHADO" ? "ring-2 ring-emerald-500" : ""}`}><Underline className="h-4 w-4" />Sublinhar</button>
                    </div>
                    <div className="mt-3">
                      <ColorPicker color={color} onChange={setColor} label="Cor da marcação" />
                      {style === "REALCE" && <div className="mt-3"><p className="text-xs font-medium text-stone-700">Intensidade do realce</p><div className="mt-2 grid grid-cols-4 gap-1.5">{highlightIntensities.map((item) => <button key={item.name} type="button" onClick={() => setOpacity(item.value)} aria-pressed={opacity === item.value} className={`rounded-lg border px-1 py-1.5 text-[11px] font-semibold ${opacity === item.value ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-stone-200 text-stone-600"}`} style={{ background: opacity === item.value ? undefined : translucentColor(color, item.value) }}>{item.name}</button>)}</div></div>}
                      <p className="mt-2 text-[11px] leading-4 text-stone-500">Clique em Paleta para escolher qualquer tom. A opção Suave é bem translúcida para preservar a leitura.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBrushEnabled((enabled) => !enabled);
                      }}
                      aria-pressed={brushEnabled}
                      className={`mt-3 w-full ${brushEnabled ? "btn-primary" : "btn-secondary"}`}
                    >
                      <Paintbrush className="h-4 w-4" />
                      {brushEnabled ? (style === "SUBLINHADO" ? "Sublinhador ativo" : "Pincel ativo") : (style === "SUBLINHADO" ? "Ativar sublinhador" : "Ativar pincel")}
                    </button>
                    {style === "REALCE" && <div className="mt-3 flex items-center gap-2" aria-label="Espessura do pincel">
                      <span className="text-xs text-stone-600">Espessura</span>
                      {[6, 12, 20].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setBrushSize(size)}
                          aria-label={`Pincel de ${size} pixels`}
                          aria-pressed={brushSize === size}
                          className={`rounded-lg border px-2 py-1 text-xs ${brushSize === size ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-stone-200"}`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>}
                    {pendingMark ? (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="max-h-24 overflow-auto whitespace-pre-wrap text-xs text-stone-700">{pendingMark.text}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => setStyle("REALCE")} aria-pressed={style === "REALCE"} className={`btn-secondary flex-1 text-xs ${style === "REALCE" ? "ring-2 ring-emerald-500" : ""}`}>Realçar</button>
                          <button type="button" onClick={() => setStyle("SUBLINHADO")} aria-pressed={style === "SUBLINHADO"} className={`btn-secondary flex-1 text-xs ${style === "SUBLINHADO" ? "ring-2 ring-emerald-500" : ""}`}><Underline className="h-4 w-4" /> Sublinhado</button>
                        </div>
                        <div className="mt-3">
                          <ColorPicker color={color} onChange={setColor} label="Cor da marcação" />
                          <div className="mt-3">
                            <p className="text-xs font-medium text-stone-700">Intensidade do realce</p>
                            <div className="mt-2 grid grid-cols-4 gap-1.5">
                              {highlightIntensities.map((item) => (
                                <button key={item.name} type="button" onClick={() => setOpacity(item.value)} aria-pressed={opacity === item.value} className={`rounded-lg border px-1 py-1.5 text-[11px] font-semibold ${opacity === item.value ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-stone-200 text-stone-600"}`} style={{ background: opacity === item.value ? undefined : translucentColor(color, item.value) }}>
                                  {item.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] leading-4 text-stone-500">Use uma cor sugerida ou toque no último círculo para escolher qualquer cor. A intensidade fica salva com a marcação.</p>
                        </div>
                        <button type="button" onClick={() => void saveMark()} disabled={savingMark} className="btn-primary mt-3 w-full text-sm">{savingMark ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Salvar marcação</button>
                      </div>
                    ) : <p className="mt-3 rounded-xl bg-stone-50 p-3 text-xs text-stone-500">Ative o pincel e pinte a área exata que deseja marcar, mesmo apenas parte de uma palavra.</p>}
                    <h3 className="mt-5 font-semibold text-stone-900">Marcações desta página</h3>
                    <div className="mt-2 space-y-2">
                      {marks.filter((mark) => mark.pagina === page).map((mark) => (
                        <div key={mark.id} className="rounded-xl border border-stone-200 p-2">
                          <div className="flex items-start gap-2">
                            <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: mark.cor }} />
                            <p className="min-w-0 flex-1 text-xs leading-5 text-stone-700">{mark.texto}</p>
                            <button type="button" onClick={() => void deleteMark(mark)} className="text-xs text-rose-700 hover:underline">Excluir</button>
                          </div>
                          <div className="mt-2 flex items-center gap-2 border-t border-stone-100 pt-2">
                            <ColorPicker color={mark.cor} onChange={(nextColor) => void updateMark(mark, { cor: nextColor })} label={`Cor da marcação ${mark.texto}`} />
                            <div className="flex min-w-0 flex-1 gap-1" aria-label={`Intensidade da marcação ${mark.texto}`}>
                              {highlightIntensities.map((item) => (
                                <button key={item.name} type="button" disabled={updatingMarkId === mark.id} onClick={() => void updateMark(mark, { opacidade: item.value })} aria-pressed={mark.opacidade === item.value} className={`min-w-0 flex-1 rounded-md border px-1 py-1 text-[10px] font-semibold ${mark.opacidade === item.value ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-stone-200 text-stone-500"}`}>
                                  {item.name.slice(0, 1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <h2 className="mt-5 font-semibold text-stone-900">Palavras-chave manuais</h2>
                <form onSubmit={addKeyword} className="mt-3 space-y-3">
                  <label className="block text-sm font-medium text-stone-700">Adicionar palavra ou expressão<input value={term} onChange={(event) => setTerm(event.target.value)} maxLength={80} required className="mt-1.5" placeholder="Ex.: oração subordinada" /></label>
                  <ColorPicker color={color} onChange={setColor} label="Cor da palavra-chave" />
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
                <button type="button" onClick={() => void save()} disabled={saving || savedPage === page} className="text-sm font-semibold text-emerald-800">{saving ? <Loader2 className="inline h-4 w-4 animate-spin" /> : savedPage === page ? `Página ${page} salva` : "Salvar página"}</button>
                <button type="button" onClick={() => move(1)} disabled={saving || Boolean(pages && page >= pages)} className="btn-secondary text-sm">Próxima<ChevronRight className="h-4 w-4" /></button>
              </footer>
            )}
          </section>
        </div>
      )}
    </>
  );
}
