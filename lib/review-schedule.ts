export const reviewSteps = [
  { days: 1, label: "1ª revisão", description: "retome o resumo enquanto o conteúdo ainda está recente" },
  { days: 7, label: "2ª revisão", description: "confirme os conceitos que precisam de reforço" },
  { days: 30, label: "3ª revisão", description: "consolide o conteúdo no longo prazo" },
] as const;

export function buildReviewSchedule(
  materialId: string,
  materialTitle: string,
  reference = new Date(),
) {
  return reviewSteps.map((step) => {
    const agendadaPara = new Date(reference);
    agendadaPara.setDate(agendadaPara.getDate() + step.days);
    agendadaPara.setHours(9, 0, 0, 0);
    return {
      materialId,
      titulo: `${step.label} · ${materialTitle}`,
      agendadaPara,
    };
  });
}
