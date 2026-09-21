import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { buildReviewSchedule } from "@/lib/review-schedule";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para preparar as revisões.", 401);
    const materials = await prisma.materialEstudo.findMany({
      where: {
        usuarioId: user.id,
        resumo: { not: null },
        revisoes: { none: {} },
      },
      select: { id: true, titulo: true },
    });
    if (!materials.length)
      return ok({ created: 0 }, "Sua agenda já está preparada.");

    await prisma.$transaction(
      materials.map((material) =>
        prisma.revisao.createMany({
          data: buildReviewSchedule(material.id, material.titulo),
        }),
      ),
    );
    return ok(
      { created: materials.length * 3 },
      "Agenda preparada com três revisões para cada material pronto.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
