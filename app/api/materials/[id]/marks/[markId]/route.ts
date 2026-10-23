import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

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
