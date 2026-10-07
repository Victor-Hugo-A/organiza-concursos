import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, noContent, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  titulo: z.string().trim().min(2).max(100),
});

async function findTopicForUser(id: string, usuarioId: string) {
  return prisma.topicoEstudo.findFirst({
    where: { id, materia: { plano: { usuarioId } } },
    select: { id: true, materiaId: true, topicoPaiId: true },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para editar um tópico.", 401);
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const topico = await findTopicForUser(id, user.id);
    if (!topico) return fail("Tópico não encontrado.", 404);

    const duplicate = await prisma.topicoEstudo.findFirst({
      where: {
        id: { not: topico.id },
        materiaId: topico.materiaId,
        topicoPaiId: topico.topicoPaiId,
        titulo: { equals: input.titulo, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) return fail("Já existe um tópico com esse nome neste nível.", 409);

    const updated = await prisma.topicoEstudo.update({
      where: { id: topico.id },
      data: { titulo: input.titulo },
    });
    return ok(updated, "Tópico atualizado.");
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
    if (!user) return fail("Entre na sua conta para excluir um tópico.", 401);
    const { id } = await params;
    const topico = await findTopicForUser(id, user.id);
    if (!topico) return fail("Tópico não encontrado.", 404);

    await prisma.topicoEstudo.delete({ where: { id: topico.id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
