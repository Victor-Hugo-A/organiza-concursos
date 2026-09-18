import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return fail("Entre na sua conta para organizar o material.", 401);
    const { id } = await params;
    const input = z
      .object({ materiaId: z.string().min(1) })
      .safeParse(await request.json());
    if (!input.success) return fail("Escolha a matéria deste PDF.");
    const materia = await prisma.materiaEstudo.findFirst({
      where: {
        id: input.data.materiaId,
        plano: { usuarioId: user.id, arquivado: false },
      },
    });
    if (!materia) return fail("Matéria não encontrada na sua conta.", 404);
    const updated = await prisma.materialEstudo.updateMany({
      where: { id, usuarioId: user.id, materiaId: null },
      data: { materiaId: materia.id, planoId: materia.planoId },
    });
    if (!updated.count)
      return fail("Este PDF não está disponível para organização.", 404);
    return ok(null, `Material organizado em ${materia.titulo}.`);
  } catch (error) {
    return handleApiError(error);
  }
}
