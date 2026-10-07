import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    materiaId: z.string().min(1),
    topicoId: z.string().min(1).nullable().optional(),
    enunciado: z.string().trim().min(10).max(10000),
    alternativas: z.array(z.string().trim().min(1).max(1000)).min(2).max(5),
    respostaCorreta: z.string().trim().min(1).max(1000),
    explicacao: z.string().trim().max(5000).optional(),
    dificuldade: z.enum(["FACIL", "MEDIO", "DIFICIL"]),
  })
  .superRefine((value, context) => {
    if (!value.alternativas.includes(value.respostaCorreta)) {
      context.addIssue({
        code: "custom",
        path: ["respostaCorreta"],
        message: "A resposta correta deve ser uma das alternativas.",
      });
    }
    if (new Set(value.alternativas.map((item) => item.toLocaleLowerCase("pt-BR"))).size !== value.alternativas.length) {
      context.addIssue({
        code: "custom",
        path: ["alternativas"],
        message: "Não repita alternativas.",
      });
    }
  });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para cadastrar uma questão.", 401);
    const input = schema.parse(await request.json());
    const materia = await prisma.materiaEstudo.findFirst({
      where: { id: input.materiaId, plano: { usuarioId: user.id, arquivado: false } },
      select: { id: true },
    });
    if (!materia) return fail("A matéria selecionada não está disponível.", 404);

    if (input.topicoId) {
      const topico = await prisma.topicoEstudo.findFirst({
        where: { id: input.topicoId, materiaId: materia.id },
        select: { id: true },
      });
      if (!topico) return fail("O tópico não pertence a esta matéria.", 400);
    }

    const question = await prisma.questaoEstudo.create({
      data: {
        usuarioId: user.id,
        materiaId: materia.id,
        topicoId: input.topicoId ?? null,
        enunciado: input.enunciado,
        alternativas: input.alternativas,
        respostaCorreta: input.respostaCorreta,
        explicacao: input.explicacao || null,
        dificuldade: input.dificuldade,
      },
    });
    return created(question, "Questão adicionada à sua prática.");
  } catch (error) {
    return handleApiError(error);
  }
}
