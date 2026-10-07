import { PracticeManager } from "@/components/practice-manager";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [plans, questions, attempts, correct] = await Promise.all([
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
      where: { usuarioId: user.id },
      orderBy: { criadoEm: "desc" },
      take: 100,
      select: {
        id: true,
        enunciado: true,
        alternativas: true,
        dificuldade: true,
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
  ]);

  return (
    <PracticeManager
      plans={plans}
      questions={questions.map((question) => ({
        ...question,
        tentativas: question.tentativas.map((attempt) => ({
          ...attempt,
          respondidaEm: attempt.respondidaEm.toISOString(),
        })),
      }))}
      stats={{ attempts, correct }}
    />
  );
}
