import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { buildReviewSchedule } from "@/lib/review-schedule";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para preparar as revisões.", 401);
    const [materials, pendingReviews] = await Promise.all([
      prisma.materialEstudo.findMany({
        where: {
          usuarioId: user.id,
          resumo: { not: null },
          revisoes: { none: {} },
        },
        select: { id: true, titulo: true },
      }),
      prisma.revisao.findMany({
        where: { status: "PENDENTE", material: { usuarioId: user.id } },
        select: { materialId: true, agendadaPara: true },
      }),
    ]);
    if (!materials.length)
      return ok({ created: 0 }, "Sua agenda já está preparada.");

    const occupiedReviews = [...pendingReviews];
    const reference = new Date();
    const reviews = materials.flatMap((material) =>
      buildReviewSchedule(
        material.id,
        material.titulo,
        reference,
        occupiedReviews,
      ),
    );
    await prisma.revisao.createMany({ data: reviews });
    return ok(
      { created: materials.length * 3 },
      "Agenda preparada com no máximo dois materiais por dia.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
