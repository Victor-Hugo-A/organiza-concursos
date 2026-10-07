import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  materiaId: z.string().min(1),
  titulo: z.string().trim().min(2).max(100),
  topicoPaiId: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para criar um tópico.", 401);

    const input = schema.parse(await request.json());
    const materia = await prisma.materiaEstudo.findFirst({
      where: {
        id: input.materiaId,
        plano: { usuarioId: user.id, arquivado: false },
      },
      select: { id: true },
    });
    if (!materia) return fail("A matéria selecionada não está disponível.", 404);

    if (input.topicoPaiId) {
      const topicoPai = await prisma.topicoEstudo.findFirst({
        where: { id: input.topicoPaiId, materiaId: materia.id },
        select: { id: true },
      });
      if (!topicoPai)
        return fail("O tópico principal não pertence a esta matéria.", 400);
    }

    const existing = await prisma.topicoEstudo.findFirst({
      where: {
        materiaId: materia.id,
        topicoPaiId: input.topicoPaiId ?? null,
        titulo: { equals: input.titulo, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existing) return fail("Já existe um tópico com esse nome neste nível.", 409);

    const lastTopic = await prisma.topicoEstudo.findFirst({
      where: { materiaId: materia.id, topicoPaiId: input.topicoPaiId ?? null },
      orderBy: { ordem: "desc" },
      select: { ordem: true },
    });
    const topico = await prisma.topicoEstudo.create({
      data: {
        materiaId: materia.id,
        topicoPaiId: input.topicoPaiId ?? null,
        titulo: input.titulo,
        ordem: (lastTopic?.ordem ?? -1) + 1,
      },
    });
    return created(topico, "Tópico criado.");
  } catch (error) {
    return handleApiError(error);
  }
}
