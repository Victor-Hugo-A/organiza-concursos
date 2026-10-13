import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { deleteMaterialFile } from "@/lib/material-files";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para excluir o material.", 401);
    const { id } = await params;
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id },
      select: { id: true, urlArquivo: true }
    });
    if (!material) return fail("Material não encontrado na sua conta.", 404);

    await prisma.materialEstudo.delete({ where: { id: material.id } });
    if (material.urlArquivo) {
      try {
        await deleteMaterialFile(material.urlArquivo, user.id);
      } catch (error) {
        await prisma.arquivoPendenteExclusao
          .upsert({
            where: { urlArquivo: material.urlArquivo },
            create: {
              usuarioId: user.id,
              urlArquivo: material.urlArquivo,
              tentativas: 1,
              ultimoErro: error instanceof Error ? error.message.slice(0, 500) : "Erro desconhecido"
            },
            update: {
              tentativas: { increment: 1 },
              ultimoErro: error instanceof Error ? error.message.slice(0, 500) : "Erro desconhecido"
            }
          })
          .catch((queueError) =>
            console.error("Não foi possível registrar a limpeza pendente", queueError)
          );
      }
    }
    return ok(null, "Material excluído.");
  } catch (error) {
    return handleApiError(error);
  }
}
