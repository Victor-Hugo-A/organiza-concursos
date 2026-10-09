import { CalendarClock, Clock3 } from "lucide-react";
import { CompleteReviewButton, PostponeReviewButton } from "@/components/review-actions";

type AgendaReview = {
  id: string;
  titulo: string;
  origem: "AUTOMATICA" | "MANUAL";
  agendadaPara: Date;
  material: { titulo: string; materia: { titulo: string } | null };
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(date: Date) {
  const difference = Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);
  if (difference < 0) return `Em atraso · ${dateFormatter.format(date)}`;
  if (difference === 0) return "Hoje";
  if (difference === 1) return "Amanhã";
  return dateFormatter.format(date);
}

export function ReviewAgenda({ reviews }: { reviews: AgendaReview[] }) {
  const groups = Array.from(
    reviews.reduce((agenda, review) => {
      const key = dayKey(review.agendadaPara);
      const group = agenda.get(key) ?? { date: review.agendadaPara, reviews: [] as AgendaReview[] };
      group.reviews.push(review);
      agenda.set(key, group);
      return agenda;
    }, new Map<string, { date: Date; reviews: AgendaReview[] }>()),
  );

  return (
    <div className="mt-5 space-y-5">
      {groups.map(([key, group]) => {
        const overdue = startOfDay(group.date) < startOfDay(new Date());
        return (
          <section key={key} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className={`flex flex-col gap-2 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${overdue ? "bg-amber-50/70" : "bg-stone-50/80"}`}>
              <div className="flex items-center gap-2">
                <CalendarClock className={`h-4 w-4 ${overdue ? "text-amber-800" : "text-emerald-800"}`} />
                <h3 className="font-semibold capitalize text-stone-950">{dayLabel(group.date)}</h3>
              </div>
              <span className="text-xs font-semibold text-stone-600">
                {group.reviews.length} de 2 materiais nesta data
              </span>
            </div>
            <div className="divide-y divide-stone-100">
              {group.reviews.map((review, index) => (
                <article key={review.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-800">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-stone-950">{review.titulo}</h4>
                    <p className="mt-1 truncate text-sm text-stone-500">
                      {review.material.titulo}{review.material.materia ? ` · ${review.material.materia.titulo}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {review.origem === "MANUAL" && <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">Agendada manualmente</span>}
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${overdue ? "text-amber-800" : "text-stone-500"}`}>
                        <Clock3 className="h-3.5 w-3.5" /> {overdue ? "Disponível desde" : "Horário"} {timeFormatter.format(review.agendadaPara)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2"><PostponeReviewButton reviewId={review.id} /><CompleteReviewButton reviewId={review.id} /></div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
