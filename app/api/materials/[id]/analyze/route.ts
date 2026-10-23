import { createHash } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { analyzePdf, PdfAnalysisError } from "@/lib/pdf-analysis";
import { extractPdfExercises } from "@/lib/pdf-exercises";
import { readMaterialPdf } from "@/lib/material-files";
import { buildReviewSchedule } from "@/lib/review-schedule";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para gerar o resumo.", 401);
    const body: unknown = await request.json().catch(() => ({}));
    const force =
      typeof body === "object" &&
      body !== null &&
      "force" in body &&
      body.force === true;
    const { id } = await params;
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id },
      include: { materia: true, plano: true },
    });
    if (!material) return fail("Material não encontrado na sua conta.", 404);
    if (material.tipo !== "PDF" || !material.urlArquivo)
      return fail("Somente materiais em PDF podem receber análise automática.", 400);
    if (!material.materiaId)
      return fail("Associe este PDF a uma matéria antes de analisá-lo.", 400);
    const materiaId = material.materiaId;
    if (!force && material.analiseStatus === "CONCLUIDA")
      return ok(null, "O resumo deste PDF já está pronto.");
    const started = new Date();
    // Atomic claim: only one parser runs per material. Expired claims can be retried.
    const claim = await prisma.materialEstudo.updateMany({
      where: {
        id,
        usuarioId: user.id,
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
      const pages = await analyzePdf(bytes, material.materia?.titulo ?? "");
      const exercises = extractPdfExercises(pages.paginasTexto);
      const importedExerciseCount = await prisma.$transaction(async (tx) => {
        const updated = await tx.materialEstudo.updateMany({
          where: { id, usuarioId: user.id, analiseIniciadaEm: started },
          data: {
            resumo: pages.resumo,
            pontosEstudo: pages.pontosEstudo,
            paginas: pages.paginas,
            analiseStatus: "CONCLUIDA",
            analiseErro: null,
          },
        });
        if (!updated.count) throw new Error("Análise substituída.");
        await tx.palavraChave.deleteMany({ where: { materialId: id } });
        await tx.palavraChave.createMany({
          data: pages.palavrasChave.map((termo) => ({
            materialId: id,
            termo,
          })),
          skipDuplicates: true,
        });
        const imported = await tx.questaoEstudo.createMany({
          data: exercises.map((exercise) => ({
            usuarioId: user.id,
            materiaId,
            topicoId: material.topicoId,
            enunciado: exercise.enunciado,
            alternativas: exercise.alternativas,
            respostaCorreta: exercise.respostaCorreta,
            explicacao: exercise.explicacao,
            dificuldade: "MEDIO",
            sourceMaterialId: id,
            sourcePage: exercise.pagina,
            sourceKey: createHash("sha256")
              .update(
                `${id}:${exercise.pagina}:${exercise.enunciado}:${exercise.alternativas.join("|")}`,
              )
              .digest("hex"),
          })),
          skipDuplicates: true,
        });
        const pendingReviews = await tx.revisao.findMany({
          where: { status: "PENDENTE", material: { usuarioId: user.id } },
          select: { materialId: true, agendadaPara: true },
        });
        await tx.revisao.createMany({
          data: buildReviewSchedule(
            material.id,
            material.titulo,
            started,
            pendingReviews,
          ),
        });
        return imported.count;
      });
      const exerciseMessage = exercises.length
        ? ` ${exercises.length} exercício(s) com gabarito explícito identificado(s); ${importedExerciseCount} novo(s) adicionado(s) à prática.`
        : " Nenhum exercício com gabarito explícito foi identificado para importação.";
      return ok(
        null,
        `Resumo e palavras-chave prontos para estudar.${exerciseMessage}`,
      );
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
