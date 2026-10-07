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
    prisma.materialEstudo.findMany({
      where: { usuarioId: user.id },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        titulo: true,
        nomeArquivo: true,
        urlArquivo: true,
        urlExterna: true,
        conteudo: true,
        tipo: true,
        materiaId: true,
        planoId: true,
        topicoId: true,
        topico: { select: { id: true, titulo: true } },
        resumo: true,
        pontosEstudo: true,
        paginas: true,
        paginaAtual: true,
        concluidoEm: true,
        ultimoAcessoEm: true,
        analiseStatus: true,
        analiseErro: true,
        palavrasChave: { select: { id: true, termo: true } },
        sessoesEstudo: {
          where: { finalizadaEm: null },
          orderBy: { iniciadaEm: "desc" },
          take: 1,
          select: { id: true, iniciadaEm: true },
        },
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
      initialMaterials={materials.map((material) => ({
        ...material,
        concluidoEm: material.concluidoEm?.toISOString() ?? null,
        ultimoAcessoEm: material.ultimoAcessoEm?.toISOString() ?? null,
        sessoesEstudo: material.sessoesEstudo.map((session) => ({
          ...session,
          iniciadaEm: session.iniciadaEm.toISOString(),
        })),
      }))}
      selectedPlan={selectedPlan}
      selectedSubject={selectedSubject}
    />
  );
}
