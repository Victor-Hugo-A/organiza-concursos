import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  RotateCcw,
} from "lucide-react";
import { CompleteReviewButton, PrepareReviewsButton } from "@/components/review-actions";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSteps } from "@/lib/review-schedule";

export const dynamic = "force-dynamic";

const formatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [reviews, completed] = await Promise.all([
    prisma.revisao.findMany({
      where: { material: { usuarioId: user.id }, status: "PENDENTE" },
      orderBy: { agendadaPara: "asc" },
      include: { material: { include: { materia: true } } },
    }),
    prisma.revisao.findMany({
      where: { material: { usuarioId: user.id }, status: "CONCLUIDA" },
      orderBy: { concluidaEm: "desc" },
      take: 6,
      include: { material: true },
    }),
  ]);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayCount = reviews.filter((review) => review.agendadaPara <= todayEnd).length;
  const nextReview = reviews[0];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-emerald-800">Agenda de estudo</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">Revisões</h1>
          <p className="mt-3 text-base leading-7 text-stone-600">
            A agenda registra cada revisão concluída e mostra exatamente qual material deve voltar para o seu estudo.
          </p>
        </div>
        <Link href="/app/materiais" className="btn-secondary">
          Ver materiais <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-emerald-900 p-5 text-white shadow-sm">
          <RotateCcw className="h-5 w-5 text-emerald-200" />
          <p className="mt-7 text-3xl font-semibold">{todayCount}</p>
          <p className="mt-1 text-sm text-emerald-100">para revisar hoje ou em atraso</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <CalendarCheck2 className="h-5 w-5 text-emerald-800" />
          <p className="mt-7 text-3xl font-semibold text-stone-950">{reviews.length}</p>
          <p className="mt-1 text-sm text-stone-600">revisões agendadas</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-[#fff8e7] p-5 shadow-sm">
          <Clock3 className="h-5 w-5 text-amber-700" />
          <p className="mt-7 text-lg font-semibold text-stone-950">{nextReview ? formatter.format(nextReview.agendadaPara) : "Agenda livre"}</p>
          <p className="mt-1 text-sm text-stone-600">{nextReview ? "próxima revisão" : "nenhuma pendência agora"}</p>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-900">Como a agenda funciona</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
              Quando o resumo de um material fica pronto, o Organiza agenda três retornos. Ao clicar em “Concluir revisão”, o retorno recebe data e hora no seu histórico.
            </p>
          </div>
          <CalendarClock className="h-5 w-5 shrink-0 text-emerald-800" />
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {reviewSteps.map((step, index) => (
            <li key={step.label} className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">{index + 1} · em {step.days} {step.days === 1 ? "dia" : "dias"}</span>
              <p className="mt-2 font-semibold text-stone-950">{step.label}</p>
              <p className="mt-1 text-sm leading-5 text-stone-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-stone-400">Próximos retornos</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">Sua agenda</h2>
          </div>
          {reviews.length > 0 && <span className="text-sm text-stone-500">Marque somente depois de estudar.</span>}
        </div>
        {!reviews.length ? (
          <div className="mt-5 rounded-3xl border border-dashed border-stone-300 bg-white/70 p-8 text-center sm:p-10">
            <CalendarCheck2 className="mx-auto h-7 w-7 text-stone-400" />
            <h3 className="mt-3 text-lg font-semibold text-stone-950">Nenhuma revisão pendente</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">
              Se você já possui resumos prontos, prepare a agenda para criar os três retornos de cada material. Novos resumos entram na agenda automaticamente.
            </p>
            <PrepareReviewsButton />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            {reviews.map((review, index) => {
              const late = review.agendadaPara < new Date();
              return (
                <article key={review.id} className="flex flex-col gap-4 border-b border-stone-100 p-5 last:border-0 sm:flex-row sm:items-center">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-800">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-stone-950">{review.titulo}</h3>
                    <p className="mt-0.5 truncate text-sm text-stone-500">
                      {review.material.titulo}{review.material.materia ? ` · ${review.material.materia.titulo}` : ""}
                    </p>
                    <p className={`mt-2 text-xs font-semibold ${late ? "text-amber-800" : "text-stone-500"}`}>
                      {late ? "Disponível para revisar desde " : "Agendada para "}{formatter.format(review.agendadaPara)}
                    </p>
                  </div>
                  <CompleteReviewButton reviewId={review.id} />
                </article>
              );
            })}
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-800" />
            <h2 className="text-xl font-semibold text-stone-950">Histórico recente</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {completed.map((review) => (
              <article key={review.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="font-semibold text-stone-900">{review.titulo}</p>
                <p className="mt-1 truncate text-sm text-stone-500">{review.material.titulo}</p>
                {review.concluidaEm && <p className="mt-3 text-xs font-medium text-emerald-800">Concluída em {formatter.format(review.concluidaEm)}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
