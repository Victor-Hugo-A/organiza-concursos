"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  FolderUp,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { PlanCreator } from "@/components/plan-creator";
import { BackLink } from "@/components/back-link";

type Plan = {
  id: string;
  titulo: string;
  materias: { id: string; titulo: string }[];
};
type Material = {
  id: string;
  titulo: string;
  nomeArquivo: string;
  urlArquivo: string;
  materiaId: string | null;
  planoId: string | null;
  resumo: string | null;
  pontosEstudo: string[];
  analiseStatus: string;
  analiseErro: string | null;
  palavrasChave: { id: string; termo: string }[];
};

async function requestJson(url: string, options: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(
      "A conexão foi interrompida. Confira sua internet e tente novamente.",
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      result?.message ??
        "Não foi possível concluir o pedido. Tente novamente em instantes.",
    );
  if (!result)
    throw new Error(
      "O servidor não retornou uma resposta válida. Atualize a página para conferir se o material foi salvo.",
    );
  return result;
}

export function MaterialsManager({
  plans,
  initialMaterials,
  selectedPlan,
  selectedSubject,
  analysisAvailable,
}: {
  plans: Plan[];
  initialMaterials: Material[];
  selectedPlan: string;
  selectedSubject: string;
  analysisAvailable: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const attemptedAnalyses = useRef(new Set<string>());
  const analysisInFlight = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [analyzingId, setAnalyzingId] = useState("");
  const [movingId, setMovingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const plan = plans.find((item) => item.id === selectedPlan);
  const subject = plan?.materias.find((item) => item.id === selectedSubject);
  const busy = pending || Boolean(analyzingId);
  const visiblePlans = plan ? [plan] : plans;
  const legacy = initialMaterials.filter(
    (material) =>
      !material.materiaId && (!plan || material.planoId === plan.id),
  );
  const materials = initialMaterials.filter(
    (material) =>
      material.materiaId === subject?.id &&
      [material.titulo, ...material.palavrasChave.map((tag) => tag.termo)]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    if (
      selected &&
      (!selected.name.toLowerCase().endsWith(".pdf") ||
        selected.size === 0 ||
        selected.size > 4 * 1024 * 1024)
    ) {
      setError("Escolha um PDF com conteúdo e tamanho de até 4 MB.");
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
    if (selected) setTitle(selected.name.replace(/\.pdf$/i, "").slice(0, 150));
  }

  const analyze = useCallback(async (id: string) => {
    if (analysisInFlight.current) return;
    analysisInFlight.current = true;
    attemptedAnalyses.current.add(id);
    setAnalyzingId(id);
    setError("");
    setMessage("PDF salvo. Lendo o documento e preparando seu resumo…");
    try {
      const result = await requestJson(`/api/materials/${id}/analyze`, {
        method: "POST",
      });
      setMessage(result.message);
    } catch (err) {
      setMessage("");
      setError(
        err instanceof Error
          ? err.message
          : "O PDF está salvo, mas não foi possível gerar o resumo.",
      );
    } finally {
      analysisInFlight.current = false;
      setAnalyzingId("");
      router.refresh();
    }
  }, [router]);

  // Resume PDFs uploaded before the service was configured, one at a time.
  // Failed attempts require an explicit retry to avoid repeated paid requests.
  useEffect(() => {
    if (!analysisAvailable || !selectedSubject || busy || analysisInFlight.current) return;
    const next = initialMaterials.find((material) =>
      material.materiaId === selectedSubject && material.analiseStatus === "PENDENTE" &&
      !material.resumo && !attemptedAnalyses.current.has(material.id));
    if (next) void analyze(next.id);
  }, [analysisAvailable, selectedSubject, initialMaterials, busy, analyze]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !subject || busy) return;
    setPending(true);
    setError("");
    setMessage("Enviando seu PDF…");
    const data = new FormData();
    data.set("arquivo", file);
    data.set("titulo", title);
    data.set("materiaId", subject.id);
    try {
      const result = await requestJson("/api/materials", {
        method: "POST",
        body: data,
      });
      setFile(null);
      setTitle("");
      formRef.current?.reset();
      router.refresh();
      if (analysisAvailable) await analyze(result.data.id);
      else
        setMessage(
          `PDF salvo em ${subject.titulo}. O resumo e as palavras-chave não foram gerados porque o serviço de IA não está configurado.`,
        );
    } catch (err) {
      setMessage("");
      setError(
        err instanceof Error ? err.message : "Não foi possível enviar o PDF.",
      );
    } finally {
      setPending(false);
    }
  }

  async function createSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setSubjectError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await requestJson("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: data.get("titulo"),
          planoId: data.get("planoId"),
        }),
      });
      router.push(
        `/app/materiais?plano=${result.data.planoId}&materia=${result.data.id}`,
      );
      router.refresh();
    } catch (err) {
      setSubjectError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar a matéria.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function moveMaterial(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setMovingId(id);
    setError("");
    setMessage("");
    const materiaId = new FormData(event.currentTarget).get("materiaId");
    try {
      const result = await requestJson(`/api/materials/${id}/subject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materiaId }),
      });
      setMessage(result.message);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível organizar o PDF.",
      );
    } finally {
      setMovingId("");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href={subject ? `/app/materiais?plano=${plan!.id}` : "/app/planos"}>
        {subject ? "Voltar às matérias" : "Voltar aos meus planos"}
      </BackLink>
      <nav
        aria-label="Caminho de estudo"
        className="mb-5 flex flex-wrap items-center gap-2 text-sm text-stone-500"
      >
        <Link href="/app/planos" className="hover:text-emerald-800">
          Meus planos
        </Link>
        <span>/</span>
        <Link
          href={plan ? `/app/materiais?plano=${plan.id}` : "/app/materiais"}
          className="hover:text-emerald-800"
        >
          {plan?.titulo ?? "Matérias"}
        </Link>
        {subject && (
          <>
            <span>/</span>
            <span className="font-semibold text-emerald-800">
              {subject.titulo}
            </span>
          </>
        )}
      </nav>
      <p className="text-sm font-semibold text-emerald-800">
        {subject ? "Um assunto de cada vez" : "Seu estudo, no lugar certo"}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
        {subject?.titulo ?? "Minhas matérias"}
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-stone-600">
        {subject
          ? "Reúna os PDFs desta matéria e transforme cada leitura em um resumo com conceitos para revisar."
          : "Crie uma matéria dentro do seu plano. Depois, abra a matéria para adicionar PDFs, consultar resumos e revisar palavras-chave."}
      </p>
      {message && (
        <p
          role="status"
          className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      {!subject ? (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-6">
              {visiblePlans.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-stone-200 bg-white p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-stone-950">
                      {item.titulo}
                    </h2>
                    <span className="text-xs text-stone-500">
                      {item.materias.length} matérias
                    </span>
                  </div>
                  {item.materias.length ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {item.materias.map((materia) => (
                        <Link
                          key={materia.id}
                          href={`/app/materiais?plano=${item.id}&materia=${materia.id}`}
                          className="group rounded-2xl border border-stone-200 p-5 transition hover:border-emerald-400 hover:bg-emerald-50/40"
                        >
                          <BookOpen className="h-5 w-5 text-emerald-800" />
                          <h3 className="mt-4 font-semibold text-stone-900">
                            {materia.titulo}
                          </h3>
                          <p className="mt-1 text-sm text-stone-500">
                            {
                              initialMaterials.filter(
                                (material) => material.materiaId === materia.id,
                              ).length
                            }{" "}
                            PDFs
                          </p>
                          <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                            Abrir matéria <ArrowRight className="h-4 w-4" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl bg-stone-50 p-5 text-sm leading-6 text-stone-600">
                      Comece criando uma matéria, como Matemática ou Língua
                      Portuguesa. Os materiais ficarão organizados dentro dela.
                    </p>
                  )}
                </div>
              ))}
              {!plans.length && (
                <div className="rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/40 p-8">
                  <BookOpen className="h-8 w-8 text-emerald-800" />
                  <h2 className="mt-4 text-xl font-semibold">
                    Comece pelo seu objetivo
                  </h2>
                  <p className="mb-6 mt-2 text-sm leading-6 text-stone-600">
                    Crie um plano para ENEM, PAS ou concurso. Em seguida,
                    adicione as matérias que precisa estudar.
                  </p>
                  <PlanCreator />
                </div>
              )}
            </section>
            {plans.length > 0 && (
              <form
                onSubmit={createSubject}
                className="h-fit rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6"
              >
                <span className="inline-flex rounded-xl bg-white p-3 text-emerald-800">
                  <Plus className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-xl font-semibold text-stone-950">
                  Criar matéria
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Dê um nome ao assunto. Você adicionará os PDFs na próxima
                  etapa.
                </p>
                <fieldset disabled={creating} className="mt-5 grid gap-4">
                  <label>
                    Plano de estudo
                    <select
                      name="planoId"
                      defaultValue={selectedPlan || plans[0].id}
                      required
                      className="mt-1.5"
                    >
                      {plans.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.titulo}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Nome da matéria
                    <input
                      name="titulo"
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="Ex.: Biologia"
                      className="mt-1.5"
                    />
                  </label>
                  {subjectError && (
                    <p role="alert" className="text-sm text-rose-700">
                      {subjectError}
                    </p>
                  )}
                  <button className="btn-primary w-full">
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Criar e adicionar materiais
                  </button>
                </fieldset>
              </form>
            )}
          </div>
          {legacy.length > 0 && (
            <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50/40 p-6">
              <h2 className="text-xl font-semibold text-stone-950">
                PDFs para organizar
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                Seus arquivos anteriores continuam aqui. Escolha uma matéria
                para cada um.
              </p>
              <div className="mt-5 space-y-4">
                {legacy.map((material) => (
                  <div key={material.id} className="rounded-2xl bg-white p-4">
                    <a
                      href={material.urlArquivo}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 font-semibold text-stone-900"
                    >
                      <FileText className="h-4 w-4" />
                      {material.titulo}
                    </a>
                    <form
                      onSubmit={(event) => moveMaterial(event, material.id)}
                      className="mt-3 flex flex-col gap-2 sm:flex-row"
                    >
                      <label className="flex-1">
                        <span className="sr-only">
                          Matéria de {material.titulo}
                        </span>
                        <select name="materiaId" required defaultValue="">
                          <option value="" disabled>
                            Escolher matéria
                          </option>
                          {plans.map((item) => (
                            <optgroup key={item.id} label={item.titulo}>
                              {item.materias.map((materia) => (
                                <option key={materia.id} value={materia.id}>
                                  {materia.titulo}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </label>
                      <button
                        disabled={
                          Boolean(movingId) ||
                          !plans.some((item) => item.materias.length)
                        }
                        className="btn-secondary"
                      >
                        {movingId === material.id
                          ? "Organizando…"
                          : "Mover para matéria"}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <form
            ref={formRef}
            onSubmit={upload}
            className="mt-8 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8"
          >
            <fieldset
              disabled={busy}
              className="grid gap-6 md:grid-cols-[1fr_1fr]"
            >
              <div>
                <span className="inline-flex rounded-2xl bg-white p-3 text-emerald-800 shadow-sm">
                  <FolderUp className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-xl font-semibold text-stone-950">
                  Adicionar PDF em {subject.titulo}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Envie uma apostila, um capítulo ou slides em PDF. O resumo e
                  as palavras-chave aparecerão junto do material para facilitar
                  sua próxima revisão.
                </p>
                <p className="mt-3 text-xs leading-5 text-stone-500">
                  PDF de até 4 MB. Ao gerar o resumo, o conteúdo é enviado ao
                  serviço de inteligência artificial da OpenAI.
                </p>
              </div>
              <div className="grid content-start gap-4">
                <label>
                  Arquivo PDF
                  <input
                    name="arquivo"
                    type="file"
                    accept=".pdf,application/pdf"
                    required
                    onChange={onFile}
                    className="mt-1.5 bg-white"
                  />
                </label>
                <label>
                  Título do material
                  <input
                    required
                    minLength={1}
                    maxLength={150}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex.: Citologia — aula 1"
                    className="mt-1.5"
                  />
                </label>
                <button disabled={!file || busy} className="btn-primary w-full">
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {analyzingId
                    ? "Preparando seu resumo…"
                    : pending
                      ? "Enviando PDF…"
                      : analysisAvailable
                        ? "Adicionar PDF e gerar resumo"
                        : "Adicionar PDF à matéria"}
                </button>
              </div>
            </fieldset>
            {!analysisAvailable && (
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                Resumo e palavras-chave indisponíveis: o serviço de IA da plataforma
                ainda não está configurado. Seus PDFs ficam salvos. Após a configuração,
                abra esta matéria para iniciar a análise automaticamente.
              </p>
            )}
          </form>
          <section className="mt-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="text-2xl font-semibold text-stone-950">
                Materiais desta matéria
              </h2>
              <label className="relative sm:w-72">
                <span className="sr-only">
                  Buscar por título ou palavra-chave
                </span>
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Título ou palavra-chave"
                  className="pl-10"
                />
              </label>
            </div>
            {!materials.length && (
              <p className="mt-5 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">
                {search
                  ? "Nenhum material corresponde à busca."
                  : "Adicione o primeiro PDF desta matéria para começar sua biblioteca de estudo."}
              </p>
            )}
            <div className="mt-5 space-y-5">
              {materials.map((material) => (
                <article
                  key={material.id}
                  className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="rounded-xl bg-rose-50 p-3 text-rose-700">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold text-stone-950">
                          {material.titulo}
                        </h3>
                        <p className="mt-1 break-all text-xs text-stone-500">
                          {material.nomeArquivo}
                        </p>
                      </div>
                    </div>
                    <a
                      href={material.urlArquivo}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-sm"
                    >
                      Abrir PDF <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                  {material.resumo ? (
                    <div className="mt-6 border-t border-stone-100 pt-5">
                      <h4 className="flex items-center gap-2 font-semibold text-emerald-900">
                        <Sparkles className="h-4 w-4" />
                        Resumo para estudar
                      </h4>
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-700">
                        {material.resumo}
                      </p>
                      {material.pontosEstudo.length > 0 && (
                        <>
                          <h4 className="mt-5 font-semibold text-stone-900">
                            Pontos para revisar
                          </h4>
                          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600">
                            {material.pontosEstudo.map((point, index) => (
                              <li key={index}>{point}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm leading-6 text-stone-600">
                        {!analysisAvailable
                          ? "PDF salvo. A geração do resumo e das palavras-chave aguarda a configuração do serviço de IA."
                          : analyzingId === material.id
                          ? "Lendo o PDF e identificando os principais conceitos…"
                          : (material.analiseErro ??
                            (material.analiseStatus === "PROCESSANDO"
                              ? "Análise em andamento. Se ela tiver sido interrompida, tente novamente em alguns instantes."
                              : "PDF salvo. Aguardando a análise automática do resumo e das palavras-chave."))}
                      </p>
                      {analysisAvailable && <button
                        type="button"
                        onClick={() => analyze(material.id)}
                        disabled={busy || !analysisAvailable}
                        className="btn-secondary mt-3 text-sm"
                      >
                        {analyzingId === material.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {material.analiseStatus === "ERRO"
                          ? "Tentar gerar resumo novamente"
                          : "Gerar resumo e palavras-chave"}
                      </button>}
                    </div>
                  )}
                  {material.palavrasChave.length > 0 && (
                    <div className="mt-5">
                      <h4 className="text-sm font-semibold text-stone-900">
                        Palavras-chave para revisão
                      </h4>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {material.palavrasChave.map((tag) => (
                          <button
                            type="button"
                            key={tag.id}
                            onClick={() => setSearch(tag.termo)}
                            className="badge hover:bg-emerald-100"
                            title="Buscar materiais com este termo"
                          >
                            {tag.termo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {material.resumo && (
                    <p className="mt-5 text-xs leading-5 text-stone-500">
                      Sugestões geradas por IA a partir deste PDF. Confira o
                      documento original. A seleção não mede a frequência dos
                      assuntos em provas anteriores.
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
          <Link
            href={`/app/materiais?plano=${plan!.id}`}
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar às matérias do plano
          </Link>
        </>
      )}
    </div>
  );
}
