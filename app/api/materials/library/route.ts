import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    materiaId: z.string().min(1),
    topicoId: z.string().min(1).nullable().optional(),
    titulo: z.string().trim().min(2).max(150),
    tipo: z.enum(["TEXTO", "ANOTACAO", "LINK"]),
    conteudo: z.string().trim().max(20000).optional(),
    urlExterna: z.preprocess(
      (value) => (typeof value === "string" && !value.trim() ? undefined : value),
      z.string().trim().url().max(2048).optional(),
    ),
  })
  .superRefine((value, context) => {
    if ((value.tipo === "TEXTO" || value.tipo === "ANOTACAO") && !value.conteudo) {
      context.addIssue({
        code: "custom",
        path: ["conteudo"],
        message: "Escreva o conteúdo do material.",
      });
    }
    if (value.tipo === "LINK" && !value.urlExterna) {
      context.addIssue({
        code: "custom",
        path: ["urlExterna"],
        message: "Informe um link válido.",
      });
    }
  });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para adicionar um material.", 401);
    const input = schema.parse(await request.json());
    const materia = await prisma.materiaEstudo.findFirst({
      where: {
        id: input.materiaId,
        plano: { usuarioId: user.id, arquivado: false },
      },
      select: { id: true, planoId: true },
    });
    if (!materia) return fail("A matéria selecionada não está disponível.", 404);

    if (input.topicoId) {
      const topico = await prisma.topicoEstudo.findFirst({
        where: { id: input.topicoId, materiaId: materia.id },
        select: { id: true },
      });
      if (!topico) return fail("O tópico não pertence a esta matéria.", 400);
    }

    const material = await prisma.materialEstudo.create({
      data: {
        usuarioId: user.id,
        planoId: materia.planoId,
        materiaId: materia.id,
        topicoId: input.topicoId ?? null,
        titulo: input.titulo,
        tipo: input.tipo,
        conteudo: input.tipo === "LINK" ? null : input.conteudo,
        urlExterna: input.tipo === "LINK" ? input.urlExterna : null,
        analiseStatus: "NAO_APLICAVEL",
      },
    });
    return created(material, "Material adicionado à biblioteca.");
  } catch (error) {
    return handleApiError(error);
  }
}
