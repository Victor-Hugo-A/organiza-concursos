import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  topicoId: z.string().min(1).nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para organizar o material.", 401);
    const { id } = await params;
    const input = schema.parse(await request.json());
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id },
      select: { id: true, materiaId: true },
    });
    if (!material) return fail("Material não encontrado na sua conta.", 404);
    if (!material.materiaId)
      return fail("Organize o material em uma matéria antes de definir o tópico.", 400);

    if (input.topicoId) {
      const topico = await prisma.topicoEstudo.findFirst({
        where: { id: input.topicoId, materiaId: material.materiaId },
        select: { id: true },
      });
      if (!topico) return fail("O tópico não pertence a esta matéria.", 400);
    }

    const updated = await prisma.materialEstudo.update({
      where: { id: material.id },
      data: { topicoId: input.topicoId },
      include: { topico: { select: { id: true, titulo: true } } },
    });
    return ok(updated, input.topicoId ? "Material classificado no tópico." : "Tópico removido do material.");
  } catch (error) {
    return handleApiError(error);
  }
}
