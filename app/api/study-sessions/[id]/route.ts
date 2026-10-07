import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  duracaoSegundos: z.number().int().min(1).max(24 * 60 * 60),
  dificuldade: z.enum(["FACIL", "MEDIO", "DIFICIL"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para finalizar a sessão.", 401);
    const { id } = await params;
    const input = schema.parse(await request.json());
    const session = await prisma.sessaoEstudo.findFirst({
      where: { id, usuarioId: user.id, finalizadaEm: null },
      select: { id: true, materialId: true },
    });
    if (!session) return fail("Sessão não encontrada ou já finalizada.", 404);

    const finalized = await prisma.$transaction(async (tx) => {
      const result = await tx.sessaoEstudo.update({
        where: { id: session.id },
        data: {
          finalizadaEm: new Date(),
          duracaoSegundos: input.duracaoSegundos,
          dificuldade: input.dificuldade,
        },
      });
      await tx.materialEstudo.update({
        where: { id: session.materialId },
        data: { ultimoAcessoEm: new Date() },
      });
      return result;
    });
    return ok(finalized, "Sessão finalizada e registrada no seu histórico.");
  } catch (error) {
    return handleApiError(error);
  }
}
