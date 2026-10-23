import { getCurrentUser } from "@/lib/auth";
import { ApiError, fail, handleApiError, noContent } from "@/lib/api-response";
import { deleteMaterialFile } from "@/lib/material-files";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para excluir o plano.", 401);

    const { id } = await params;
    const materials = await prisma.$transaction(async (transaction) => {
      const plan = await transaction.planoEstudo.findFirst({
        where: { id, usuarioId: user.id },
        select: { id: true },
      });
      if (!plan) throw new ApiError(404, "Plano não encontrado na sua conta.");

      const materialWhere = {
        usuarioId: user.id,
        OR: [{ planoId: plan.id }, { materia: { planoId: plan.id } }],
      };
      const planMaterials = await transaction.materialEstudo.findMany({
        where: materialWhere,
        select: { urlArquivo: true },
      });

      await transaction.materialEstudo.deleteMany({ where: materialWhere });
      const deletedPlan = await transaction.planoEstudo.deleteMany({
        where: { id: plan.id, usuarioId: user.id },
      });
      if (deletedPlan.count === 0) {
        throw new ApiError(404, "Plano não encontrado na sua conta.");
      }

      return planMaterials;
    });

    const fileUrls = new Set(
      materials.flatMap((material) =>
        material.urlArquivo ? [material.urlArquivo] : [],
      ),
    );
    for (const urlArquivo of fileUrls) {
      try {
        await deleteMaterialFile(urlArquivo, user.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message.slice(0, 500) : "Erro desconhecido";
        await prisma.arquivoPendenteExclusao
          .upsert({
            where: { urlArquivo },
            create: {
              usuarioId: user.id,
              urlArquivo,
              tentativas: 1,
              ultimoErro: message,
            },
            update: {
              tentativas: { increment: 1 },
              ultimoErro: message,
            },
          })
          .catch((queueError) =>
            console.error("Não foi possível registrar a limpeza pendente", queueError),
          );
      }
    }

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
