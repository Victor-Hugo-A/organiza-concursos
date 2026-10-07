import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  paginaAtual: z.number().int().min(1).nullable().optional(),
  concluido: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para atualizar o progresso.", 401);
    const { id } = await params;
    const input = schema.parse(await request.json());
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id },
      select: { id: true, paginas: true },
    });
    if (!material) return fail("Material não encontrado na sua conta.", 404);
    if (input.paginaAtual && material.paginas && input.paginaAtual > material.paginas)
      return fail(`Informe uma página entre 1 e ${material.paginas}.`, 400);

    const updated = await prisma.materialEstudo.update({
      where: { id: material.id },
      data: {
        paginaAtual: input.paginaAtual,
        concluidoEm:
          input.concluido === undefined
            ? undefined
            : input.concluido
              ? new Date()
              : null,
        ultimoAcessoEm: new Date(),
      },
    });
    return ok(
      updated,
      input.concluido === true
        ? "Material marcado como concluído."
        : "Progresso de leitura salvo.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
