import Link from "next/link";
import { ArrowRight, BarChart3, CalendarCheck2, CalendarClock, CheckCircle2, Clock3, History, PlayCircle, Plus, Target } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function materialHref(material: { id: string; planoId: string | null; materiaId: string | null }) {
  return material.planoId && material.materiaId ? `/app/materiais?plano=${material.planoId}&materia=${material.materiaId}#material-${material.id}` : "/app/materiais";
}

function duration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`;
}

function weekStart() {
  const date = new Date();
  date.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const now = new Date();
  const start = weekStart();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const [plans, latestMaterial, sessions, recentSessions, reviews, subjects, attempts, correct] = await Promise.all([
    prisma.planoEstudo.findMany({ where: { usuarioId: user.id, arquivado: false }, orderBy: { atualizadoEm: "desc" }, select: { id: true, _count: { select: { materiais: true } } } }),
    prisma.materialEstudo.findFirst({ where: { usuarioId: user.id }, orderBy: [{ ultimoAcessoEm: { sort: "desc", nulls: "last" } }, { criadoEm: "desc" }], select: { id: true, titulo: true, planoId: true, materiaId: true, paginas: true, paginaAtual: true, concluidoEm: true, materia: { select: { titulo: true } }, topico: { select: { titulo: true } } } }),
    prisma.sessaoEstudo.findMany({ where: { usuarioId: user.id, finalizadaEm: { gte: start }, duracaoSegundos: { not: null } }, select: { duracaoSegundos: true, material: { select: { topicoId: true } } } }),
    prisma.sessaoEstudo.findMany({ where: { usuarioId: user.id, finalizadaEm: { not: null }, duracaoSegundos: { not: null } }, orderBy: { finalizadaEm: "desc" }, take: 5, select: { id: true, finalizadaEm: true, duracaoSegundos: true, material: { select: { id: true, titulo: true, planoId: true, materiaId: true, materia: { select: { titulo: true } } } } } }),
    prisma.revisao.findMany({ where: { material: { usuarioId: user.id }, status: "PENDENTE", agendadaPara: { lte: todayEnd } }, orderBy: { agendadaPara: "asc" }, take: 4, select: { id: true, titulo: true, agendadaPara: true, material: { select: { titulo: true, materia: { select: { titulo: true } } } } } }),
    prisma.materiaEstudo.findMany({ where: { plano: { usuarioId: user.id, arquivado: false }, materiais: { some: {} } }, orderBy: { titulo: "asc" }, select: { id: true, titulo: true, plano: { select: { titulo: true } }, materiais: { select: { concluidoEm: true } } } }),
    prisma.tentativaQuestao.count({ where: { usuarioId: user.id, respondidaEm: { gte: start } } }),
    prisma.tentativaQuestao.count({ where: { usuarioId: user.id, correta: true, respondidaEm: { gte: start } } }),
  ]);
  const seconds = sessions.reduce((total, session) => total + (session.duracaoSegundos ?? 0), 0);
  const topics = new Set(sessions.map((session) => session.material.topicoId).filter(Boolean)).size;
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : null;
  const formatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const firstName = user.nome.trim().split(/\s+/)[0];
  const totalMaterials = plans.reduce((total, plan) => total + plan._count.materiais, 0);

  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-emerald-800">Visão geral</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Olá, {firstName}.</h1><p className="mt-2 text-stone-600">Seu panorama de estudo, sempre baseado nos seus registros.</p></div><Link href="/app/materiais" className="btn-primary"><Plus className="h-4 w-4" /> Adicionar material</Link></div>

    <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><PlayCircle className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-emerald-800">Continuar estudando</p><h2 className="mt-1 text-xl font-semibold text-stone-950 sm:text-2xl">{latestMaterial?.titulo ?? "Nenhum material em andamento"}</h2>{latestMaterial ? <p className="mt-2 text-sm text-stone-600">{[latestMaterial.materia?.titulo, latestMaterial.topico?.titulo].filter(Boolean).join(" · ") || "Material de estudo"}{latestMaterial.paginas && latestMaterial.paginaAtual ? ` · Página ${latestMaterial.paginaAtual} de ${latestMaterial.paginas}` : ""}{latestMaterial.concluidoEm ? " · Concluído" : ""}</p> : <p className="mt-2 text-sm text-stone-600">Adicione um material à biblioteca para começar.</p>}</div></div>{latestMaterial ? <Link href={materialHref(latestMaterial)} className="btn-primary shrink-0"><PlayCircle className="h-4 w-4" /> Continuar</Link> : <Link href="/app/materiais" className="btn-secondary shrink-0">Abrir biblioteca</Link>}</div></section>

    <section className="mt-8"><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-800" /><div><p className="text-sm font-bold uppercase tracking-wider text-stone-400">Acompanhamento</p><h2 className="text-2xl font-semibold text-stone-950">Estudos da semana</h2></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<Clock3 />} value={seconds ? duration(seconds) : "—"} label="tempo estudado" accent /><Stat icon={<Target />} value={String(topics)} label="tópicos estudados" /><Stat icon={<CheckCircle2 />} value={String(attempts)} label="questões respondidas" /><Stat icon={<BarChart3 />} value={accuracy === null ? "—" : `${accuracy}%`} label="de aproveitamento" /></div></section>

    <section className="mt-10 grid gap-6 lg:grid-cols-5"><div className="lg:col-span-3"><Title eyebrow="Progresso real" title="Por disciplina" href="/app/planos" label="Meus planos" />{subjects.length ? <div className="mt-5 space-y-3">{subjects.map((subject) => { const done = subject.materiais.filter((material) => material.concluidoEm).length; const percent = Math.round(done / subject.materiais.length * 100); return <article key={subject.id} className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex justify-between gap-4"><div><h3 className="font-semibold text-stone-950">{subject.titulo}</h3><p className="mt-1 text-xs text-stone-500">{subject.plano.titulo} · {done} de {subject.materiais.length} concluídos</p></div><strong className="text-emerald-800">{percent}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${percent}%` }} /></div></article>; })}</div> : <Empty icon={<Target />} text="O progresso aparece quando uma disciplina tiver materiais vinculados." href="/app/planos" label="Organizar disciplinas" />}</div>
      <div className="lg:col-span-2"><Title eyebrow="Prioridade" title="Revisões de hoje" href="/app/revisoes" label="Agenda" />{reviews.length ? <div className="mt-5 space-y-3">{reviews.map((review) => <Link key={review.id} href="/app/revisoes" className="block rounded-2xl border border-stone-200 bg-white p-4 hover:border-emerald-200"><div className="flex gap-3"><CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" /><div className="min-w-0"><h3 className="truncate font-semibold text-stone-950">{review.titulo}</h3><p className="mt-1 truncate text-sm text-stone-500">{review.material.materia?.titulo ?? review.material.titulo}</p><p className="mt-2 text-xs font-semibold text-amber-800">{review.agendadaPara < now ? "Em atraso desde " : "Hoje às "}{formatter.format(review.agendadaPara)}</p></div></div></Link>)}</div> : <Empty icon={<CalendarCheck2 />} text="Nenhuma revisão para hoje." href="/app/revisoes" label="Ver agenda" />}</div></section>

    <section className="mt-10 grid gap-6 lg:grid-cols-5"><div className="rounded-3xl bg-[#fff8e7] p-6 lg:col-span-2"><Target className="h-5 w-5 text-amber-700" /><p className="mt-6 text-3xl font-semibold text-stone-950">{plans.length}</p><p className="mt-1 text-sm text-stone-600">{plans.length === 1 ? "plano ativo" : "planos ativos"} · {totalMaterials} materiais organizados</p><Link href="/app/planos" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-amber-900">Gerenciar planos <ArrowRight className="h-4 w-4" /></Link></div><div className="lg:col-span-3"><Title eyebrow="Atividade" title="Sessões recentes" href="/app/materiais" label="Estudar agora" />{recentSessions.length ? <div className="mt-5 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">{recentSessions.map((session) => <article key={session.id} className="flex items-center gap-4 p-4"><Clock3 className="h-5 w-5 shrink-0 text-emerald-800" /><div className="min-w-0 flex-1"><Link href={materialHref(session.material)} className="block truncate font-semibold text-stone-900 hover:text-emerald-800">{session.material.titulo}</Link><p className="text-sm text-stone-500">{session.material.materia?.titulo ?? "Material"} · {session.finalizadaEm && formatter.format(session.finalizadaEm)}</p></div><strong className="shrink-0 text-sm text-emerald-800">{duration(session.duracaoSegundos ?? 0)}</strong></article>)}</div> : <Empty icon={<History />} text="Suas sessões concluídas aparecerão aqui." href="/app/materiais" label="Estudar agora" />}</div></section>
  </div>;
}

function Stat({ icon, value, label, accent = false }: { icon: React.ReactNode; value: string; label: string; accent?: boolean }) { return <div className={`rounded-2xl p-5 ${accent ? "bg-emerald-900 text-white" : "border border-stone-200 bg-white"}`}><span className={accent ? "text-emerald-200" : "text-emerald-800"}>{icon}</span><p className="mt-6 text-2xl font-semibold">{value}</p><p className={`mt-1 text-sm ${accent ? "text-emerald-100" : "text-stone-600"}`}>{label}</p></div>; }
function Title({ eyebrow, title, href, label }: { eyebrow: string; title: string; href: string; label: string }) { return <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wider text-stone-400">{eyebrow}</p><h2 className="text-2xl font-semibold text-stone-950">{title}</h2></div><Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-800">{label} <ArrowRight className="h-4 w-4" /></Link></div>; }
function Empty({ icon, text, href, label }: { icon: React.ReactNode; text: string; href: string; label: string }) { return <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white/70 p-7 text-center"><span className="mx-auto block w-fit text-stone-400">{icon}</span><p className="mt-3 text-sm text-stone-600">{text}</p><Link href={href} className="mt-3 inline-flex text-sm font-semibold text-emerald-800">{label}</Link></div>; }
