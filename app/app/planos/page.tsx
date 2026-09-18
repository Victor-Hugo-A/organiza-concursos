import Link from "next/link";
import { ArrowRight, CalendarDays, Target } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanCreator } from "@/components/plan-creator";

export const dynamic = "force-dynamic";

const typeLabels = { ENEM: "ENEM", PAS: "PAS", CONCURSO_PUBLICO: "Concurso público", VESTIBULAR: "Vestibular", OUTRO: "Outro objetivo" };

export default async function PlansPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const plans = await prisma.planoEstudo.findMany({
    where: { usuarioId: user.id, arquivado: false },
    orderBy: { atualizadoEm: "desc" },
    include: { _count: { select: { materiais: { where: { materiaId: { not: null } } }, materias: true } } }
  });

  return <div className="mx-auto max-w-6xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-emerald-800">Planos de estudo</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">Meus planos</h1><p className="mt-2 text-stone-600">Crie um plano para a prova que você vai fazer. Dentro dele, organize suas matérias e os PDFs de cada assunto.</p></div><PlanCreator /></div>
    {plans.length === 0 ? <section className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white/60 p-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Target className="h-5 w-5" /></span><h2 className="mt-4 text-xl font-semibold text-stone-950">Crie seu primeiro plano</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">Por exemplo: ENEM 2027 ou Concurso do Banco do Brasil. Depois, cadastre matérias como Português e Matemática e envie seus PDFs.</p><div className="mt-5 flex justify-center"><PlanCreator /></div></section> : <section className="mt-8 grid gap-5 lg:grid-cols-2">{plans.map((plan) => <article key={plan.id} className="overflow-hidden rounded-3xl border border-stone-200 bg-white"><div className="bg-emerald-900 p-6 text-white"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200"><Target className="h-4 w-4" /> {typeLabels[plan.tipo]}</span><h2 className="mt-8 text-2xl font-semibold tracking-tight">{plan.titulo}</h2></div><div className="flex items-center justify-between gap-3 p-5"><div><div className="flex flex-wrap gap-2"><span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-900">{plan._count.materias} {plan._count.materias === 1 ? "matéria cadastrada" : "matérias cadastradas"}</span><span className="rounded-lg bg-stone-100 px-2.5 py-1 text-sm font-medium text-stone-700">{plan._count.materiais} {plan._count.materiais === 1 ? "PDF organizado" : "PDFs organizados"}</span></div><p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500"><CalendarDays className="h-3.5 w-3.5" /> Última alteração: {new Intl.DateTimeFormat("pt-BR").format(plan.atualizadoEm)}</p></div><Link href={`/app/materiais?plano=${plan.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800">Abrir matérias <ArrowRight className="h-4 w-4" /></Link></div></article>)}</section>}
  </div>;
}
