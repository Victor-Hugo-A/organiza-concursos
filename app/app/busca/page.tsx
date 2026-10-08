import Link from "next/link";
import { BookOpen, FileText, FolderTree, Search, TextQuote } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function materialHref(material: { id: string; planoId: string | null; materiaId: string | null }) {
  return material.planoId && material.materiaId ? `/app/materiais?plano=${material.planoId}&materia=${material.materiaId}#material-${material.id}` : "/app/materiais";
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const whereText = { contains: query, mode: "insensitive" as const };
  const hasQuery = query.length >= 2;
  const [subjects, topics, materials, questions] = hasQuery ? await Promise.all([
    prisma.materiaEstudo.findMany({ where: { plano: { usuarioId: user.id, arquivado: false }, titulo: whereText }, take: 10, orderBy: { titulo: "asc" }, select: { id: true, titulo: true, plano: { select: { titulo: true } } } }),
    prisma.topicoEstudo.findMany({ where: { materia: { plano: { usuarioId: user.id, arquivado: false } }, titulo: whereText }, take: 10, orderBy: { titulo: "asc" }, select: { id: true, titulo: true, materia: { select: { id: true, titulo: true, plano: { select: { titulo: true } } } } } }),
    prisma.materialEstudo.findMany({ where: { usuarioId: user.id, OR: [{ titulo: whereText }, { nomeArquivo: whereText }, { conteudo: whereText }, { resumo: whereText }] }, take: 10, orderBy: { atualizadoEm: "desc" }, select: { id: true, titulo: true, planoId: true, materiaId: true, tipo: true, materia: { select: { titulo: true } }, topico: { select: { titulo: true } } } }),
    prisma.questaoEstudo.findMany({ where: { usuarioId: user.id, OR: [{ enunciado: whereText }, { explicacao: whereText }] }, take: 10, orderBy: { atualizadoEm: "desc" }, select: { id: true, enunciado: true, materia: { select: { titulo: true } }, topico: { select: { titulo: true } } } }),
  ]) : [[], [], [], []] as const;
  const resultCount = subjects.length + topics.length + materials.length + questions.length;

  return <div className="mx-auto max-w-5xl">
    <div><p className="text-sm font-semibold text-emerald-800">Localize seu conteúdo</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Pesquisa global</h1><p className="mt-2 max-w-2xl text-stone-600">Encontre disciplinas, tópicos, materiais e questões na sua área de estudos.</p></div>
    <form action="/app/busca" className="mt-7 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="study-search">Pesquisar nos estudos</label><div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-stone-400" /><input id="study-search" name="q" defaultValue={query} minLength={2} maxLength={100} autoFocus className="!pl-11" placeholder="Ex.: crase, juros compostos, Constituição..." /></div><button className="btn-primary"><Search className="h-4 w-4" /> Pesquisar</button></form>
    {!hasQuery ? <EmptySearch /> : <><p className="mt-7 text-sm text-stone-500">{resultCount ? `${resultCount} ${resultCount === 1 ? "resultado encontrado" : "resultados encontrados"} para “${query}”.` : `Nenhum resultado para “${query}”.`}</p><div className="mt-5 grid gap-5 lg:grid-cols-2">
      <ResultSection icon={<BookOpen className="h-5 w-5" />} title="Disciplinas" count={subjects.length}>{subjects.map((subject) => <Link key={subject.id} href="/app/planos" className="result-link"><strong>{subject.titulo}</strong><span>{subject.plano.titulo}</span></Link>)}</ResultSection>
      <ResultSection icon={<FolderTree className="h-5 w-5" />} title="Tópicos" count={topics.length}>{topics.map((topic) => <Link key={topic.id} href={`/app/materiais?materia=${topic.materia.id}`} className="result-link"><strong>{topic.titulo}</strong><span>{topic.materia.plano.titulo} · {topic.materia.titulo}</span></Link>)}</ResultSection>
      <ResultSection icon={<FileText className="h-5 w-5" />} title="Materiais" count={materials.length}>{materials.map((material) => <Link key={material.id} href={materialHref(material)} className="result-link"><strong>{material.titulo}</strong><span>{material.tipo} · {[material.materia?.titulo, material.topico?.titulo].filter(Boolean).join(" · ") || "Sem vínculo"}</span></Link>)}</ResultSection>
      <ResultSection icon={<TextQuote className="h-5 w-5" />} title="Questões" count={questions.length}>{questions.map((question) => <Link key={question.id} href="/app/pratica" className="result-link"><strong className="line-clamp-2">{question.enunciado}</strong><span>{[question.materia.titulo, question.topico?.titulo].filter(Boolean).join(" · ")}</span></Link>)}</ResultSection>
    </div></>}
  </div>;
}

function ResultSection({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) { return <section className="rounded-3xl border border-stone-200 bg-white p-5"><div className="flex items-center gap-2 text-emerald-800">{icon}<h2 className="font-semibold text-stone-950">{title}</h2><span className="ml-auto text-xs font-semibold text-stone-500">{count}</span></div>{count ? <div className="mt-4 space-y-2">{children}</div> : <p className="mt-4 text-sm text-stone-500">Nenhum resultado nesta categoria.</p>}</section>; }
function EmptySearch() { return <section className="mt-7 rounded-3xl border border-dashed border-stone-300 bg-white/70 p-10 text-center"><Search className="mx-auto h-7 w-7 text-stone-400" /><h2 className="mt-3 text-lg font-semibold text-stone-950">O que você procura?</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">Digite ao menos dois caracteres para pesquisar em todos os seus conteúdos organizados.</p></section>; }
