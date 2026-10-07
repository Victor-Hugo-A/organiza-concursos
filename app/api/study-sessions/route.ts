import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ materialId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para iniciar uma sessão.", 401);
    const input = schema.parse(await request.json());

    const material = await prisma.materialEstudo.findFirst({
      where: { id: input.materialId, usuarioId: user.id },
      select: { id: true, titulo: true },
    });
    if (!material) return fail("Material não encontrado na sua conta.", 404);

    const active = await prisma.sessaoEstudo.findFirst({
      where: { usuarioId: user.id, finalizadaEm: null },
      orderBy: { iniciadaEm: "desc" },
      select: { id: true, materialId: true, iniciadaEm: true },
    });
    if (active) {
      if (active.materialId === material.id)
        return ok(active, "Sua sessão já está em andamento.");
      return fail("Finalize a sessão em andamento antes de iniciar outro material.", 409);
    }

    const session = await prisma.$transaction(async (tx) => {
      const createdSession = await tx.sessaoEstudo.create({
        data: { usuarioId: user.id, materialId: material.id },
      });
      await tx.materialEstudo.update({
        where: { id: material.id },
        data: { ultimoAcessoEm: new Date() },
      });
      return createdSession;
    });
    return created(session, `Sessão iniciada em ${material.titulo}.`);
  } catch (error) {
    return handleApiError(error);
  }
}
