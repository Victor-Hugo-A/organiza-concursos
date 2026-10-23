import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, noContent, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  titulo: z.string().trim().min(2).max(100),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para editar uma matéria.", 401);

    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const subject = await prisma.materiaEstudo.findFirst({
      where: { id, plano: { usuarioId: user.id, arquivado: false } },
      select: { id: true, planoId: true },
    });
    if (!subject) return fail("Matéria não encontrada na sua conta.", 404);

    const duplicate = await prisma.materiaEstudo.findFirst({
      where: {
        id: { not: subject.id },
        planoId: subject.planoId,
        titulo: { equals: input.titulo, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      return fail("Já existe uma matéria com esse nome neste plano.", 409);
    }

    const updated = await prisma.materiaEstudo.update({
      where: { id: subject.id },
      data: { titulo: input.titulo },
    });
    return ok(updated, "Matéria atualizada.");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para excluir uma matéria.", 401);

    const { id } = await params;
    const deleted = await prisma.materiaEstudo.deleteMany({
      where: { id, plano: { usuarioId: user.id, arquivado: false } },
    });
    if (deleted.count === 0) {
      return fail("Matéria não encontrada na sua conta.", 404);
    }

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
