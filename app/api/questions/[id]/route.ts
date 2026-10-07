import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError, noContent } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para excluir uma questão.", 401);
    const { id } = await params;
    const question = await prisma.questaoEstudo.findFirst({
      where: { id, usuarioId: user.id },
      select: { id: true },
    });
    if (!question) return fail("Questão não encontrada na sua conta.", 404);
    await prisma.questaoEstudo.delete({ where: { id: question.id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
