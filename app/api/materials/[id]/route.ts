import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { deleteMaterialFile } from "@/lib/material-files";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para excluir o PDF.", 401);
    const { id } = await params;
    const material = await prisma.materialEstudo.findFirst({ where: { id, usuarioId: user.id }, select: { id: true, urlArquivo: true } });
    if (!material) return fail("PDF não encontrado na sua conta.", 404);
    await prisma.materialEstudo.delete({ where: { id: material.id } });
    await deleteMaterialFile(material.urlArquivo, user.id).catch((error) => console.error("Não foi possível remover o arquivo físico", error));
    return ok(null, "PDF excluído.");
  } catch (error) {
    return handleApiError(error);
  }
}
