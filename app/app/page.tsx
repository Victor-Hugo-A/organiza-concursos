import Link from "next/link";
import { ArrowRight, CalendarClock, Clock3, History, PlayCircle, Plus, Target } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function materialHref(material: { id: string; planoId: string | null; materiaId: string | null }) {
  if (!material.planoId || !material.materiaId) return "/app/materiais";
  return `/app/materiais?plano=${material.planoId}&materia=${material.materiaId}#material-${material.id}`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}min` : ""}`.trim();
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [plans, latestMaterial, recentSessions, nextReview] = await Promise.all([
    prisma.planoEstudo.findMany({
      where: { usuarioId: user.id, arquivado: false },
      orderBy: { atualizadoEm: "desc" },
      take: 2,
      include: { _count: { select: { materiais: true, materias: true } } },
    }),
    prisma.materialEstudo.findFirst({
      where: { usuarioId: user.id },
      orderBy: [{ ultimoAcessoEm: { sort: "desc", nulls: "last" } }, { criadoEm: "desc" }],
      include: { plano: true, materia: true },
    }),
    prisma.sessaoEstudo.findMany({
      where: { usuarioId: user.id, finalizadaEm: { not: null }, duracaoSegundos: { not: null } },
      orderBy: { finalizadaEm: "desc" },
      take: 4,
      include: { material: { include: { materia: true } } },
    }),
    prisma.revisao.findFirst({
      where: { material: { usuarioId: user.id }, status: "PENDENTE" },
      orderBy: { agendadaPara: "asc" },
      include: { material: true },
    }),
  ]);

  const firstName = user.nome.trim().split(/\s+/)[0];
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const shortDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold capitalize text-emerald-800">{today}</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">Bom dia, {firstName}.</h1><p className="mt-2 text-stone-600">Retome um material ou registre uma nova sessão de estudo.</p></div>
        <Link href="/app/materiais" className="btn-primary"><Plus className="h-4 w-4" /> Abrir biblioteca</Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-emerald-900 p-5 text-white md:col-span-2"><Target className="h-5 w-5 text-emerald-200" /><p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Planos ativos</p><p className="mt-2 text-3xl font-semibold">{plans.length}</p><p className="mt-2 text-sm text-emerald-100">{plans.length ? `${plans.reduce((total, plan) => total + plan._count.materiais, 0)} materiais organizados nos planos recentes` : "Crie seu primeiro plano para começar a organizar o estudo."}</p><Link href="/app/planos" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white">Ver meus planos <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="rounded-2xl border border-stone-200 bg-[#fff8e7] p-5"><CalendarClock className="h-5 w-5 text-amber-700" /><p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Próxima revisão</p><p className="mt-2 text-lg font-semibold text-stone-950">{nextReview?.titulo ?? "Nenhuma agendada"}</p><p className="mt-1 text-sm text-stone-600">{nextReview ? shortDate.format(nextReview.agendadaPara) : "Quando um resumo ficar pronto, as revisões entram na agenda."}</p><Link href="/app/revisoes" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-900">Abrir agenda <ArrowRight className="h-4 w-4" /></Link></div>
      </section>

      <section className="mt-10 rounded-3xl border border-stone-200 bg-white p-6 sm:p-7">
        <div className="flex items-start gap-3"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-800"><PlayCircle className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-emerald-800">Continuar estudando</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">{latestMaterial?.titulo ?? "Seu próximo material aparecerá aqui"}</h2>{latestMaterial ? <p className="mt-2 text-sm text-stone-600">{[latestMaterial.materia?.titulo, latestMaterial.plano?.titulo].filter(Boolean).join(" · ")}{latestMaterial.paginas && latestMaterial.paginaAtual ? ` · Página ${latestMaterial.paginaAtual} de ${latestMaterial.paginas}` : ""}{latestMaterial.concluidoEm ? " · Concluído" : ""}</p> : <p className="mt-2 text-sm text-stone-600">Adicione um material à biblioteca e inicie uma sessão para acompanhar sua evolução.</p>}</div></div>
        {latestMaterial && <Link href={materialHref(latestMaterial)} className="btn-primary mt-5"><PlayCircle className="h-4 w-4" /> Continuar estudando</Link>}
      </section>

      <section className="mt-10"><div className="flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-stone-400">Histórico</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">Sessões recentes</h2></div><Link href="/app/materiais" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">Estudar agora <ArrowRight className="h-4 w-4" /></Link></div>
        {recentSessions.length ? <div className="mt-5 grid gap-3">{recentSessions.map((session) => <article key={session.id} className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Clock3 className="h-5 w-5" /></span><div className="min-w-0 flex-1"><Link href={materialHref(session.material)} className="block truncate font-semibold text-stone-900 hover:text-emerald-800">{session.material.titulo}</Link><p className="mt-0.5 text-sm text-stone-500">{session.material.materia?.titulo ?? "Material de estudo"} · {session.finalizadaEm ? shortDate.format(session.finalizadaEm) : ""}</p></div><span className="text-sm font-semibold text-emerald-800">{formatDuration(session.duracaoSegundos ?? 0)}</span></article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center"><History className="mx-auto h-6 w-6 text-stone-400" /><p className="mt-3 text-sm text-stone-600">Suas sessões concluídas aparecerão aqui.</p></div>}
      </section>
    </div>
  );
}
