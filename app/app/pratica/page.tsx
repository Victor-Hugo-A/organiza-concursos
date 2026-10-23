import { PracticeManager } from "@/components/practice-manager";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ material?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const query = await searchParams;
  const materialValue = Array.isArray(query.material)
    ? query.material[0]
    : query.material;
  const materialId = materialValue?.slice(0, 100) ?? "";

  const [plans, questions, attempts, correct, attemptsByQuestion, sourceMaterial] = await Promise.all([
    prisma.planoEstudo.findMany({
      where: { usuarioId: user.id, arquivado: false },
      orderBy: { titulo: "asc" },
      select: {
        id: true,
        titulo: true,
        materias: {
          orderBy: [{ ordem: "asc" }, { titulo: "asc" }],
          select: {
            id: true,
            titulo: true,
            topicos: {
              orderBy: [{ ordem: "asc" }, { titulo: "asc" }],
              select: { id: true, titulo: true, topicoPaiId: true },
            },
          },
        },
      },
    }),
    prisma.questaoEstudo.findMany({
      where: {
        usuarioId: user.id,
        ...(materialId ? { sourceMaterialId: materialId } : {}),
      },
      orderBy: { criadoEm: "desc" },
      take: materialId ? 800 : 100,
      select: {
        id: true,
        enunciado: true,
        alternativas: true,
        dificuldade: true,
        sourcePage: true,
        sourceMaterial: { select: { id: true, titulo: true } },
        materia: { select: { titulo: true } },
        topico: { select: { titulo: true } },
        tentativas: {
          orderBy: { respondidaEm: "desc" },
          take: 1,
          select: { correta: true, respondidaEm: true },
        },
        _count: { select: { tentativas: true } },
      },
    }),
    prisma.tentativaQuestao.count({ where: { usuarioId: user.id } }),
    prisma.tentativaQuestao.count({ where: { usuarioId: user.id, correta: true } }),
    prisma.tentativaQuestao.groupBy({
      by: ["questaoId", "correta"],
      where: { usuarioId: user.id },
      _count: { _all: true },
    }),
    materialId
      ? prisma.materialEstudo.findFirst({
          where: { id: materialId, usuarioId: user.id },
          select: { id: true, titulo: true },
        })
      : null,
  ]);

  const questionAttempts = new Map<string, { correct: number; incorrect: number }>();
  for (const attempt of attemptsByQuestion) {
    const totals = questionAttempts.get(attempt.questaoId) ?? { correct: 0, incorrect: 0 };
    if (attempt.correta) totals.correct = attempt._count._all;
    else totals.incorrect = attempt._count._all;
    questionAttempts.set(attempt.questaoId, totals);
  }

  return (
    <PracticeManager
      plans={plans}
      questions={questions.map((question) => ({
        ...question,
        attemptTotals: questionAttempts.get(question.id) ?? { correct: 0, incorrect: 0 },
        tentativas: question.tentativas.map((attempt) => ({
          ...attempt,
          respondidaEm: attempt.respondidaEm.toISOString(),
        })),
      }))}
      stats={{ attempts, correct }}
      sourceMaterial={sourceMaterial}
    />
  );
}
