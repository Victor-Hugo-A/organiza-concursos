import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  termo: z.string().trim().min(1).max(80),
  cor: z.string().regex(/^#[\da-fA-F]{6}$/),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para salvar uma palavra-chave.", 401);
    const { id } = await params;
    const input = schema.parse(await request.json());
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id },
      select: { id: true },
    });
    if (!material) return fail("Material não encontrado na sua conta.", 404);

    const keyword = await prisma.palavraChave.upsert({
      where: { materialId_termo: { materialId: id, termo: input.termo } },
      create: {
        materialId: id,
        termo: input.termo,
        origem: "MANUAL",
        cor: input.cor.toUpperCase(),
      },
      update: { origem: "MANUAL", cor: input.cor.toUpperCase() },
    });
    return created(keyword, "Palavra-chave destacada neste material.");
  } catch (error) {
    return handleApiError(error);
  }
}
