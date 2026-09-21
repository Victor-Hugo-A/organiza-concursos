import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { analyzePdf, PdfAnalysisError } from "@/lib/pdf-analysis";
import { readMaterialPdf } from "@/lib/material-files";
import { buildReviewSchedule } from "@/lib/review-schedule";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para gerar o resumo.", 401);
    const { id } = await params;
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id },
      include: { materia: true, plano: true },
    });
    if (!material) return fail("Material não encontrado na sua conta.", 404);
    if (material.analiseStatus === "CONCLUIDA")
      return ok(null, "O resumo deste PDF já está pronto.");
    const started = new Date();
    // Atomic claim: only one parser runs per material. Expired claims can be retried.
    const claim = await prisma.materialEstudo.updateMany({
      where: {
        id,
        usuarioId: user.id,
        analiseStatus: { not: "CONCLUIDA" },
        OR: [
          { analiseStatus: { not: "PROCESSANDO" } },
          { analiseIniciadaEm: { lt: new Date(Date.now() - 150000) } },
          { analiseIniciadaEm: null },
        ],
      },
      data: {
        analiseStatus: "PROCESSANDO",
        analiseIniciadaEm: started,
        analiseErro: null,
      },
    });
    if (!claim.count)
      return fail(
        "Este PDF já está sendo analisado. Aguarde alguns instantes e atualize a página.",
        409,
      );
    try {
      const bytes = await readMaterialPdf(material.urlArquivo, user.id);
      const analysis = await analyzePdf(bytes, material.materia?.titulo ?? "");
      await prisma.$transaction(async (tx) => {
        const updated = await tx.materialEstudo.updateMany({
          where: { id, usuarioId: user.id, analiseIniciadaEm: started },
          data: {
            resumo: analysis.resumo,
            pontosEstudo: analysis.pontosEstudo,
            paginas: analysis.paginas,
            analiseStatus: "CONCLUIDA",
            analiseErro: null,
          },
        });
        if (!updated.count) throw new Error("Análise substituída.");
        await tx.palavraChave.createMany({
          data: analysis.palavrasChave.map((termo) => ({
            materialId: id,
            termo,
          })),
          skipDuplicates: true,
        });
        await tx.revisao.createMany({
          data: buildReviewSchedule(material.id, material.titulo),
        });
      });
      return ok(null, "Resumo e palavras-chave prontos para estudar.");
    } catch (error) {
      const message =
        error instanceof PdfAnalysisError
          ? error.message
          : "Não foi possível ler ou analisar o PDF salvo. Tente novamente; se persistir, envie outra cópia do arquivo.";
      await prisma.materialEstudo.updateMany({
        where: { id, usuarioId: user.id, analiseIniciadaEm: started },
        data: { analiseStatus: "ERRO", analiseErro: message },
      });
      return fail(message, 502);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
