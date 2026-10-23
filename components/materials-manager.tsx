"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  FolderUp,
  Link2,
  Loader2,
  NotebookPen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { PlanCreator } from "@/components/plan-creator";
import { BackLink } from "@/components/back-link";
import { TopicManager } from "@/components/topic-manager";
import { useToast } from "@/components/toast-provider";
import { MaterialStudyActions } from "@/components/material-study-actions";
import { PdfReader } from "@/components/pdf-reader";
import { DeleteMaterialDialog } from "@/components/delete-material-dialog";
import { SubjectManagement } from "@/components/subject-management";

type Plan = {
  id: string;
  titulo: string;
  materias: {
    id: string;
    titulo: string;
    topicos: { id: string; titulo: string; topicoPaiId: string | null }[];
    _count: { questoes: number };
  }[];
};
type Material = {
  id: string;
  titulo: string;
  nomeArquivo: string | null;
  urlArquivo: string | null;
  urlExterna: string | null;
  conteudo: string | null;
  tipo: "PDF" | "IMAGEM" | "SLIDE" | "DOCUMENTO" | "TEXTO" | "ANOTACAO" | "LINK";
  materiaId: string | null;
  planoId: string | null;
  topicoId: string | null;
  topico: { id: string; titulo: string } | null;
  paginas: number | null;
  _count: { questoes: number };
  paginaAtual: number | null;
  concluidoEm: string | null;
  ultimoAcessoEm: string | null;
  palavrasChave: {
    id: string;
    termo: string;
    origem: string;
    cor: string;
  }[];
  sessoesEstudo: { id: string; iniciadaEm: string }[];
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
  if (response.status === 204) return { success: true, message: "" };
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
}: {
  plans: Plan[];
  initialMaterials: Material[];
  selectedPlan: string;
  selectedSubject: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [materialType, setMaterialType] = useState("TODOS");
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [movingId, setMovingId] = useState("");
  const [topicUpdatingId, setTopicUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [savedPages, setSavedPages] = useState<Record<string, number>>({});
  const [subjectsModalPlan, setSubjectsModalPlan] = useState<Plan | null>(null);
  const plan = plans.find((item) => item.id === selectedPlan);
  const subject = plan?.materias.find((item) => item.id === selectedSubject);
  const busy = pending;
  const visiblePlans = plan ? [plan] : plans;
  const legacy = initialMaterials.filter(
    (material) =>
      !material.materiaId && (!plan || material.planoId === plan.id),
  );
  const materials = initialMaterials.filter(
    (material) =>
      material.materiaId === subject?.id &&
      (materialType === "TODOS" || material.tipo === materialType) &&
      [
        material.titulo,
        material.nomeArquivo,
        material.conteudo,
        material.urlExterna,
        ...material.palavrasChave.map((tag) => tag.termo),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    if (
      selected &&
      (!(selected.type === "application/pdf" ||
        ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(selected.type)) ||
        selected.size === 0 ||
        selected.size > 4 * 1024 * 1024)
    ) {
      setError("Escolha um PDF ou uma imagem PNG, JPEG, GIF ou WebP de até 4 MB.");
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
    if (selected) setTitle(selected.name.replace(/\.[^.]+$/, "").slice(0, 150));
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !subject || busy) return;
    setPending(true);
    setError("");
    setMessage("Enviando seu arquivo…");
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
      setMessage(result.message);
    } catch (err) {
      setMessage("");
      setError(
        err instanceof Error ? err.message : "Não foi possível enviar o arquivo.",
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

  async function updateMaterialTopic(
    event: FormEvent<HTMLFormElement>,
    id: string,
  ) {
    event.preventDefault();
    setTopicUpdatingId(id);
    setError("");
    setMessage("");
    const topicoId = String(new FormData(event.currentTarget).get("topicoId") ?? "");
    try {
      const result = await requestJson(`/api/materials/${id}/topic`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicoId: topicoId || null }),
      });
      setMessage(result.message);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o tópico do material.",
      );
    } finally {
      setTopicUpdatingId("");
    }
  }

  async function removeMaterial() {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;
    setDeletingId(id);
    setError("");
    setMessage("");
    try {
      await requestJson(`/api/materials/${id}`, { method: "DELETE" });
      setMessage("");
      notify(
        "destructive",
        `Material excluído: “${title}”. Esta ação não pode ser desfeita.`,
      );
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível excluir o material.";
      setError(message);
      notify("error", message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <BackLink
          href={subject ? `/app/materiais?plano=${plan!.id}` : "/app/planos"}
        >
          {subject ? "Voltar às matérias" : "Voltar aos meus planos"}
        </BackLink>
        <nav
          aria-label="Caminho de estudo"
          className="flex flex-wrap items-center gap-2 text-sm text-stone-500"
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
      </div>
      <p className="text-sm font-semibold text-emerald-800">
        {subject ? "Um assunto de cada vez" : "Seu estudo, no lugar certo"}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          {subject?.titulo ?? "Minha Biblioteca"}
        </h1>
        {subject && plan && (
          <SubjectManagement
            subject={{
              id: subject.id,
              titulo: subject.titulo,
              planoId: plan.id,
              topicCount: subject.topicos.length,
              materialCount: initialMaterials.filter(
                (material) => material.materiaId === subject.id,
              ).length,
              questionCount: subject._count.questoes,
            }}
          />
        )}
      </div>
      <p className="mt-3 max-w-2xl leading-7 text-stone-600">
        {subject
          ? "Organize os PDFs e as imagens desta matéria e faça marcações diretamente durante a leitura."
          : "Crie uma matéria dentro do seu plano e adicione PDFs ou imagens para estudar."}
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
                    <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {item.materias.slice(0, 0).map((materia) => (
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
                    <button type="button" onClick={() => setSubjectsModalPlan(item)} className="mt-4 flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50"><span><span className="block font-semibold text-stone-950">Escolher matéria para estudar</span><span className="mt-1 block text-sm text-stone-600">Veja os materiais organizados em cada uma das {item.materias.length} matérias.</span></span><ArrowRight className="h-5 w-5 shrink-0 text-emerald-800" /></button>
                    </>
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
                      href={material.urlArquivo ? `/api/materials/${material.id}/file` : material.urlExterna ?? "#"}
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
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({ id: material.id, title: material.titulo })
                      }
                      disabled={Boolean(deletingId)}
                      className="btn-secondary mt-2 text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                    >
                      {deletingId === material.id ? (
                        "Excluindo…"
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" /> Excluir PDF
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <TopicManager
            materiaId={subject.id}
            topics={subject.topicos}
            materialCountByTopic={initialMaterials.reduce<Record<string, number>>(
              (counts, material) => {
                if (material.topicoId) {
                  counts[material.topicoId] = (counts[material.topicoId] ?? 0) + 1;
                }
                return counts;
              },
              {},
            )}
          />
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
                  Adicionar PDF ou imagem em {subject.titulo}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Envie um PDF ou uma imagem para consultar no leitor da plataforma.
                </p>
                <p className="mt-3 text-xs leading-5 text-stone-500">
                  Arquivos de até 4 MB. São aceitos PDFs de até 800 páginas e imagens PNG, JPEG, GIF ou WebP.
                </p>
              </div>
              <div className="grid content-start gap-4">
                <label>
                  Arquivo PDF ou imagem
                  <input
                    name="arquivo"
                    type="file"
                    accept=".pdf,application/pdf,.png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp"
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
                <label>
                  Tópico relacionado
                  <select name="topicoId" defaultValue="" className="mt-1.5">
                    <option value="">Ainda não classificar em um tópico</option>
                    {subject.topicos.map((topic) => {
                      const parent = subject.topicos.find(
                        (candidate) => candidate.id === topic.topicoPaiId,
                      );
                      return (
                        <option key={topic.id} value={topic.id}>
                          {parent ? `${parent.titulo} › ${topic.titulo}` : topic.titulo}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <button disabled={!file || busy} className="btn-primary w-full">
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderUp className="h-4 w-4" />
                  )}
                  {pending ? "Enviando arquivo…" : "Adicionar PDF ou imagem"}
                </button>
              </div>
            </fieldset>
          </form>
          <section className="mt-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="text-2xl font-semibold text-stone-950">
                Materiais desta matéria
              </h2>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <label className="relative sm:w-72">
                  <span className="sr-only">Buscar na biblioteca</span>
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar na biblioteca"
                    className="!pl-10"
                  />
                </label>
                <select
                  value={materialType}
                  onChange={(event) => setMaterialType(event.target.value)}
                  aria-label="Filtrar por tipo de material"
                  className="sm:w-40"
                >
                  <option value="TODOS">Todos os tipos</option>
                  <option value="PDF">PDFs</option>
                  <option value="IMAGEM">Imagens</option>
                  <option value="TEXTO">Textos</option>
                  <option value="ANOTACAO">Anotações</option>
                  <option value="LINK">Links</option>
                </select>
              </div>
            </div>
            {!materials.length && (
              <p className="mt-5 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">
                {search || materialType !== "TODOS"
                  ? "Nenhum material corresponde à busca."
                  : "Adicione um PDF ou uma imagem para começar sua biblioteca de estudo."}
              </p>
            )}
            <div className="mt-5 space-y-5">
              {materials.map((material) => (
                <article
                  key={material.id}
                  id={`material-${material.id}`}
                  className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="rounded-xl bg-rose-50 p-3 text-rose-700">
                        {material.tipo === "LINK" ? <Link2 className="h-5 w-5" /> : material.tipo === "ANOTACAO" ? <NotebookPen className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold text-stone-950">
                          {material.titulo}
                        </h3>
                        <p className="mt-1 break-all text-xs text-stone-500">
                          {material.nomeArquivo ?? (material.tipo === "ANOTACAO" ? "Anotação" : material.tipo === "TEXTO" ? "Texto" : material.tipo === "LINK" ? "Link externo" : "Material")}
                        </p>
                        {material.topico && (
                          <p className="mt-2 text-xs font-semibold text-emerald-800">
                            Tópico: {material.topico.titulo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {material.urlArquivo && (material.tipo === "PDF" || material.tipo === "IMAGEM") && <PdfReader id={material.id} title={material.titulo} pages={material.paginas} currentPage={savedPages[material.id] ?? material.paginaAtual} keywords={material.palavrasChave} tipo={material.tipo} onProgressSaved={(page) => setSavedPages((current) => ({ ...current, [material.id]: page }))} />}
                      {(material.urlArquivo || material.urlExterna) && (
                        <a
                          href={
                            material.urlArquivo
                              ? `/api/materials/${material.id}/file${material.tipo === "PDF" && material.paginaAtual ? `#page=${material.paginaAtual}` : ""}`
                              : material.urlExterna ?? undefined
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary text-sm"
                        >
                          {material.tipo === "LINK" ? "Abrir link" : material.tipo === "IMAGEM" ? "Abrir imagem" : "Abrir PDF"} <ArrowRight className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ id: material.id, title: material.titulo })
                        }
                        disabled={Boolean(deletingId)}
                        className="btn-secondary text-sm text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                      >
                        {deletingId === material.id ? (
                          "Excluindo…"
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" /> Excluir
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <details className="group mt-5 border-t border-stone-100 pt-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 transition hover:border-emerald-200 hover:bg-emerald-50 [&::-webkit-details-marker]:hidden">
                      <span className="group-open:hidden">Expandir material</span>
                      <span className="hidden group-open:inline">Recolher material</span>
                      <ChevronDown className="h-4 w-4 text-emerald-800 transition-transform group-open:rotate-180" />
                    </summary>
                  <MaterialStudyActions
                    onProgressSaved={(page) => setSavedPages((current) => ({ ...current, [material.id]: page }))}
                    material={{
                      id: material.id,
                      titulo: material.titulo,
                      paginas: material.paginas,
                      paginaAtual: savedPages[material.id] ?? material.paginaAtual,
                      concluidoEm: material.concluidoEm,
                      activeSession: material.sessoesEstudo[0] ?? null,
                    }}
                  />
                  {material.conteudo && (
                    <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm leading-7 text-stone-700">
                      <p className="whitespace-pre-wrap">{material.conteudo}</p>
                    </div>
                  )}
                  {material._count.questoes > 0 && (
                    <Link
                      href={`/app/pratica?material=${material.id}`}
                      className="btn-primary mt-5 text-sm"
                    >
                      Praticar {material._count.questoes}{" "}
                      {material._count.questoes === 1 ? "exercício" : "exercícios"} deste PDF
                    </Link>
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
                  {subject.topicos.length > 0 && (
                    <form
                      onSubmit={(event) => updateMaterialTopic(event, material.id)}
                      className="mt-5 flex flex-col gap-2 border-t border-stone-100 pt-5 sm:flex-row sm:items-end"
                    >
                      <label className="min-w-0 flex-1 text-sm font-semibold text-stone-700">
                        Tópico deste material
                        <select
                          name="topicoId"
                          defaultValue={material.topicoId ?? ""}
                          className="mt-1.5"
                        >
                          <option value="">Sem tópico</option>
                          {subject.topicos.map((topic) => {
                            const parent = subject.topicos.find(
                              (candidate) => candidate.id === topic.topicoPaiId,
                            );
                            return (
                              <option key={topic.id} value={topic.id}>
                                {parent
                                  ? `${parent.titulo} › ${topic.titulo}`
                                  : topic.titulo}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <button
                        disabled={Boolean(topicUpdatingId)}
                        className="btn-secondary text-sm"
                      >
                        {topicUpdatingId === material.id
                          ? "Salvando…"
                          : "Salvar tópico"}
                      </button>
                    </form>
                  )}
                  </details>
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
      <DeleteMaterialDialog
        material={deleteTarget ? { id: deleteTarget.id, titulo: deleteTarget.title } : null}
        pending={Boolean(deletingId)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeMaterial}
      />
      {subjectsModalPlan && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/35 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Todas as matérias"
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {subjectsModalPlan.titulo}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-stone-950">
                  Escolha uma matéria
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSubjectsModalPlan(null)}
                className="btn-secondary text-sm"
              >
                Fechar
              </button>
            </div>
            <div className="mt-5 grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">
              {subjectsModalPlan.materias.map((materia) => {
                const materialCount = initialMaterials.filter(
                  (material) => material.materiaId === materia.id,
                ).length;
                return (
                  <article
                    key={materia.id}
                    className="rounded-2xl border border-stone-200 p-4"
                  >
                    <Link
                      href={`/app/materiais?plano=${subjectsModalPlan.id}&materia=${materia.id}`}
                      onClick={() => setSubjectsModalPlan(null)}
                      className="block rounded-xl font-semibold text-stone-900 hover:text-emerald-800"
                    >
                      {materia.titulo}
                      <span className="mt-1 block text-xs font-normal text-stone-500">
                        {materialCount}{" "}
                        {materialCount === 1
                          ? "material organizado"
                          : "materiais organizados"}
                      </span>
                    </Link>
                    <div className="mt-3 border-t border-stone-100 pt-3">
                      <SubjectManagement
                        subject={{
                          id: materia.id,
                          titulo: materia.titulo,
                          planoId: subjectsModalPlan.id,
                          topicCount: materia.topicos.length,
                          materialCount,
                          questionCount: materia._count.questoes,
                        }}
                        onUpdated={() => setSubjectsModalPlan(null)}
                        onDeleted={() => setSubjectsModalPlan(null)}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
