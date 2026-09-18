import Link from "next/link";
import { ArrowRight, CalendarClock, FileText, Plus, Target } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [plans, materials, nextReview] = await Promise.all([
    prisma.planoEstudo.findMany({
      where: { usuarioId: user.id, arquivado: false },
      orderBy: { atualizadoEm: "desc" },
      take: 2,
      include: { _count: { select: { materiais: true, materias: true } } }
    }),
    prisma.materialEstudo.findMany({
      where: { usuarioId: user.id },
      orderBy: { atualizadoEm: "desc" },
      take: 3,
      include: { plano: true, palavrasChave: true }
    }),
    prisma.revisao.findFirst({
      where: { material: { usuarioId: user.id }, status: "PENDENTE" },
      orderBy: { agendadaPara: "asc" },
      include: { material: true }
    })
  ]);

  const firstName = user.nome.trim().split(/\s+/)[0];
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold capitalize text-emerald-800">{today}</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">Bom dia, {firstName}.</h1><p className="mt-2 text-stone-600">Seu espaço mostra somente o que pertence à sua conta.</p></div><Link href="/app/materiais" className="btn-primary"><Plus className="h-4 w-4" /> Adicionar material</Link></div>

    <section className="mt-8 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-emerald-900 p-5 text-white md:col-span-2"><Target className="h-5 w-5 text-emerald-200" /><p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Planos ativos</p><p className="mt-2 text-3xl font-semibold">{plans.length}</p><p className="mt-2 text-sm text-emerald-100">{plans.length ? `${plans.reduce((total, plan) => total + plan._count.materiais, 0)} materiais organizados nos planos recentes` : "Crie seu primeiro plano para começar a organizar o estudo."}</p><Link href="/app/planos" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white">Ver meus planos <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="rounded-2xl border border-stone-200 bg-[#fff8e7] p-5"><CalendarClock className="h-5 w-5 text-amber-700" /><p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Próxima revisão</p><p className="mt-2 text-lg font-semibold text-stone-950">{nextReview?.titulo ?? "Nenhuma agendada"}</p><p className="mt-1 text-sm text-stone-600">{nextReview ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(nextReview.agendadaPara) : "As revisões aparecerão aqui."}</p></div>
    </section>

    <section className="mt-10"><div className="flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-stone-400">Para retomar</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">Materiais recentes</h2></div>{materials.length > 0 && <Link href="/app/materiais" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">Ver todos <ArrowRight className="h-4 w-4" /></Link>}</div>
      {materials.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center"><FileText className="mx-auto h-6 w-6 text-stone-400" /><h3 className="mt-3 font-semibold text-stone-950">Seu acervo está vazio</h3><p className="mt-1 text-sm text-stone-600">Adicione um PDF e escolha as palavras-chave importantes.</p><Link href="/app/materiais" className="btn-secondary mt-5">Adicionar primeiro material</Link></div> : <div className="mt-5 grid gap-3">{materials.map((material) => <article key={material.id} className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700"><FileText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-stone-900">{material.titulo}</p><p className="mt-0.5 text-sm text-stone-500">{material.plano?.titulo ?? "Sem plano"}</p><div className="mt-2 flex flex-wrap gap-1.5">{material.palavrasChave.map((tag) => <span key={tag.id} className="badge">{tag.termo}</span>)}</div></div></article>)}</div>}
    </section>
  </div>;
}
