import { CalendarCheck2, Clock3, RotateCcw } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const reviews = await prisma.revisao.findMany({
    where: { material: { usuarioId: user.id }, status: "PENDENTE" },
    orderBy: { agendadaPara: "asc" },
    include: { material: true }
  });
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayCount = reviews.filter((review) => review.agendadaPara <= todayEnd).length;

  return <div className="mx-auto max-w-6xl"><div><p className="text-sm font-semibold text-emerald-800">Memória em movimento</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">Revisões</h1><p className="mt-2 text-stone-600">Volte aos pontos certos no momento certo.</p></div><section className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-emerald-900 p-5 text-white"><RotateCcw className="h-5 w-5 text-emerald-200" /><p className="mt-8 text-3xl font-semibold">{todayCount}</p><p className="mt-1 text-sm text-emerald-100">revisões para hoje</p></div><div className="rounded-2xl border border-stone-200 bg-white p-5"><CalendarCheck2 className="h-5 w-5 text-emerald-800" /><p className="mt-8 text-3xl font-semibold text-stone-950">{reviews.length}</p><p className="mt-1 text-sm text-stone-600">revisões pendentes</p></div><div className="rounded-2xl border border-stone-200 bg-[#fff8e7] p-5"><Clock3 className="h-5 w-5 text-amber-700" /><p className="mt-8 text-3xl font-semibold text-stone-950">{reviews.length * 10} min</p><p className="mt-1 text-sm text-stone-600">tempo estimado</p></div></section><section className="mt-10"><p className="text-sm font-bold uppercase tracking-[0.14em] text-stone-400">Sua sequência</p>{reviews.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center"><CalendarCheck2 className="mx-auto h-6 w-6 text-stone-400" /><h2 className="mt-3 font-semibold text-stone-950">Nenhuma revisão pendente</h2><p className="mt-1 text-sm text-stone-600">Suas próximas revisões aparecerão aqui.</p></div> : <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white">{reviews.map((review, index) => <article key={review.id} className="flex items-center gap-4 border-b border-stone-100 p-5 last:border-0"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-800">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><h2 className="font-semibold text-stone-950">{review.titulo}</h2><p className="mt-0.5 truncate text-sm text-stone-500">{review.material.titulo}</p></div><p className="text-xs font-medium text-stone-500">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(review.agendadaPara)}</p></article>)}</div>}</section></div>;
}
