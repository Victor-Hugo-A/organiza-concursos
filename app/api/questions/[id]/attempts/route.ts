import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ respostaEscolhida: z.string().trim().min(1).max(1000) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para responder uma questão.", 401);
    const { id } = await params;
    const input = schema.parse(await request.json());
    const question = await prisma.questaoEstudo.findFirst({
      where: { id, usuarioId: user.id },
      select: { id: true, respostaCorreta: true, alternativas: true, explicacao: true },
    });
    if (!question) return fail("Questão não encontrada na sua conta.", 404);
    if (!question.alternativas.includes(input.respostaEscolhida))
      return fail("Escolha uma alternativa válida.", 400);

    const correct = question.respostaCorreta === input.respostaEscolhida;
    const attempt = await prisma.tentativaQuestao.create({
      data: {
        usuarioId: user.id,
        questaoId: question.id,
        respostaEscolhida: input.respostaEscolhida,
        correta: correct,
      },
    });
    return created(
      {
        tentativa: attempt,
        correta: correct,
        respostaCorreta: question.respostaCorreta,
        explicacao: question.explicacao,
      },
      correct ? "Resposta correta." : "Resposta registrada. Confira a explicação.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
