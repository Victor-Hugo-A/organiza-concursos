import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { created, fail, handleApiError } from "@/lib/api-response";

const schema = z.object({
  titulo: z.string().trim().min(2).max(100),
  planoId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para criar uma matéria.", 401);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success)
      return fail(
        "Escolha um plano e informe um nome de matéria entre 2 e 100 caracteres.",
      );
    const plano = await prisma.planoEstudo.findFirst({
      where: { id: parsed.data.planoId, usuarioId: user.id, arquivado: false },
    });
    if (!plano)
      return fail("O plano selecionado não está disponível na sua conta.", 404);
    const materia = await prisma.materiaEstudo.create({ data: parsed.data });
    return created(
      materia,
      "Matéria criada. Agora adicione os PDFs que deseja estudar.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
