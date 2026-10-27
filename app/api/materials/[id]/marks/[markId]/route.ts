import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const updateSchema = z
  .object({
    cor: z.string().regex(/^#[\da-fA-F]{6}$/).optional(),
    opacidade: z.number().min(0.12).max(0.56).optional(),
  })
  .refine((data) => data.cor !== undefined || data.opacidade !== undefined);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; markId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para editar marcações.", 401);
    const { id, markId } = await params;
    const input = updateSchema.parse(await request.json());
    const mark = await prisma.marcacaoMaterial.findFirst({
      where: { id: markId, materialId: id, material: { usuarioId: user.id } },
      select: { id: true },
    });
    if (!mark) return fail("Marcação não encontrada.", 404);
    const updated = await prisma.marcacaoMaterial.update({
      where: { id: mark.id },
      data: {
        ...(input.cor ? { cor: input.cor.toUpperCase() } : {}),
        ...(input.opacidade !== undefined ? { opacidade: input.opacidade } : {}),
      },
    });
    return ok(updated, "Marcação atualizada.");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; markId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para remover marcações.", 401);
    const { id, markId } = await params;
    const result = await prisma.marcacaoMaterial.deleteMany({
      where: { id: markId, materialId: id, material: { usuarioId: user.id } },
    });
    if (!result.count) return fail("Marcação não encontrada.", 404);
    return ok(null, "Marcação removida do PDF.");
  } catch (error) {
    return handleApiError(error);
  }
}
