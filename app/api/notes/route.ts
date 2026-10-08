import { z } from "zod";
import { created, fail, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ titulo: z.string().trim().min(2).max(150), conteudo: z.string().trim().min(1).max(20000), materiaId: z.string().min(1).nullable().optional(), topicoId: z.string().min(1).nullable().optional(), materialId: z.string().min(1).nullable().optional() });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para criar uma anotação.", 401);
    const input = schema.parse(await request.json());
    if (input.materiaId && !await prisma.materiaEstudo.findFirst({ where: { id: input.materiaId, plano: { usuarioId: user.id } }, select: { id: true } })) return fail("Matéria inválida.", 400);
    if (input.materialId && !await prisma.materialEstudo.findFirst({ where: { id: input.materialId, usuarioId: user.id }, select: { id: true } })) return fail("Material inválido.", 400);
    const note = await prisma.anotacaoEstudo.create({ data: { usuarioId: user.id, titulo: input.titulo, conteudo: input.conteudo, materiaId: input.materiaId ?? null, topicoId: input.topicoId ?? null, materialId: input.materialId ?? null } });
    return created(note, "Anotação criada.");
  } catch (error) { return handleApiError(error); }
}
