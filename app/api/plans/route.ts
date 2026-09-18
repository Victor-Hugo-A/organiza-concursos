import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { created, fail, handleApiError } from "@/lib/api-response";

const schema = z.object({
  titulo: z.string().trim().min(2).max(100),
  tipo: z.enum(["ENEM", "PAS", "CONCURSO_PUBLICO", "VESTIBULAR", "OUTRO"])
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Sessão inválida.", 401);
    const input = schema.parse(await request.json());
    const plano = await prisma.planoEstudo.create({ data: { usuarioId: user.id, ...input } });
    return created(plano, "Plano criado.");
  } catch (error) {
    return handleApiError(error);
  }
}
