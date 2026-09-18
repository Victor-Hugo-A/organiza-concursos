import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaterialsManager } from "@/components/materials-manager";

export const dynamic = "force-dynamic";

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string; materia?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const query = await searchParams;
  const [plans, materials] = await Promise.all([
    prisma.planoEstudo.findMany({
      where: { usuarioId: user.id, arquivado: false },
      orderBy: { titulo: "asc" },
      select: {
        id: true,
        titulo: true,
        materias: {
          orderBy: [{ ordem: "asc" }, { titulo: "asc" }],
          select: { id: true, titulo: true },
        },
      },
    }),
    prisma.materialEstudo.findMany({
      where: { usuarioId: user.id },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        titulo: true,
        nomeArquivo: true,
        urlArquivo: true,
        materiaId: true,
        planoId: true,
        resumo: true,
        pontosEstudo: true,
        analiseStatus: true,
        analiseErro: true,
        palavrasChave: { select: { id: true, termo: true } },
      },
    }),
  ]);
  const selectedSubject =
    plans
      .flatMap((plan) => plan.materias)
      .find((subject) => subject.id === query.materia)?.id ?? "";
  const selectedPlan =
    (selectedSubject
      ? plans.find((plan) =>
          plan.materias.some((subject) => subject.id === selectedSubject),
        )
      : plans.find((plan) => plan.id === query.plano)
    )?.id ?? "";
  return (
    <MaterialsManager
      key={`${selectedPlan}:${selectedSubject}`}
      plans={plans}
      initialMaterials={materials}
      selectedPlan={selectedPlan}
      selectedSubject={selectedSubject}
      analysisAvailable={Boolean(process.env.OPENAI_API_KEY?.trim())}
    />
  );
}
