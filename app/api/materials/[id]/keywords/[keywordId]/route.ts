import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, noContent, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  cor: z.string().regex(/^#[\da-fA-F]{6}$/),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; keywordId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para alterar o destaque.", 401);
    const { id, keywordId } = await params;
    const input = schema.parse(await request.json());
    const keyword = await prisma.palavraChave.findFirst({
      where: { id: keywordId, materialId: id, material: { usuarioId: user.id } },
      select: { id: true },
    });
    if (!keyword) return fail("Palavra-chave não encontrada neste material.", 404);
    const updated = await prisma.palavraChave.update({
      where: { id: keyword.id },
      data: { cor: input.cor.toUpperCase() },
    });
    return ok(updated, "Cor do destaque atualizada.");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; keywordId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para remover o destaque.", 401);
    const { id, keywordId } = await params;
    const keyword = await prisma.palavraChave.findFirst({
      where: { id: keywordId, materialId: id, material: { usuarioId: user.id } },
      select: { id: true },
    });
    if (!keyword) return fail("Palavra-chave não encontrada neste material.", 404);
    await prisma.palavraChave.delete({ where: { id: keyword.id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
