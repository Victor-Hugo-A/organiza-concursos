export const reviewSteps = [
  { days: 1, label: "1ª revisão", description: "retome o resumo enquanto o conteúdo ainda está recente" },
  { days: 7, label: "2ª revisão", description: "confirme os conceitos que precisam de reforço" },
  { days: 30, label: "3ª revisão", description: "consolide o conteúdo no longo prazo" },
] as const;

type OccupiedReview = {
  materialId: string;
  agendadaPara: Date;
};

const MAX_MATERIALS_PER_DAY = 2;

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function buildReviewSchedule(
  materialId: string,
  materialTitle: string,
  reference = new Date(),
  occupiedReviews: OccupiedReview[] = [],
) {
  const occupiedByDay = new Map<string, Set<string>>();
  for (const review of occupiedReviews) {
    const key = dayKey(review.agendadaPara);
    const materials = occupiedByDay.get(key) ?? new Set<string>();
    materials.add(review.materialId);
    occupiedByDay.set(key, materials);
  }

  const schedule = reviewSteps.map((step) => {
    const agendadaPara = new Date(reference);
    agendadaPara.setDate(agendadaPara.getDate() + step.days);
    agendadaPara.setHours(9, 0, 0, 0);
    while (true) {
      const materials = occupiedByDay.get(dayKey(agendadaPara));
      if (!materials || materials.has(materialId) || materials.size < MAX_MATERIALS_PER_DAY)
        break;
      agendadaPara.setDate(agendadaPara.getDate() + 1);
    }
    const key = dayKey(agendadaPara);
    const materials = occupiedByDay.get(key) ?? new Set<string>();
    materials.add(materialId);
    occupiedByDay.set(key, materials);
    return {
      materialId,
      titulo: `${step.label} · ${materialTitle}`,
      agendadaPara,
    };
  });
  occupiedReviews.push(...schedule);
  return schedule;
}
