import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para registrar a revisão.", 401);
    const { id } = await params;
    const review = await prisma.revisao.findFirst({
      where: { id, material: { usuarioId: user.id } },
    });
    if (!review) return fail("Revisão não encontrada na sua conta.", 404);
    if (review.status === "CONCLUIDA")
      return ok(null, "Esta revisão já foi registrada.");

    await prisma.revisao.update({
      where: { id: review.id },
      data: { status: "CONCLUIDA", concluidaEm: new Date() },
    });
    return ok(null, "Revisão registrada. Seu histórico foi atualizado.");
  } catch (error) {
    return handleApiError(error);
  }
}
