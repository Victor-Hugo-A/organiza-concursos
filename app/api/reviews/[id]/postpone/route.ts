import { fail, handleApiError, ok } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para reagendar uma revisão.", 401);
    const { id } = await params;
    const review = await prisma.revisao.findFirst({ where: { id, status: "PENDENTE", material: { usuarioId: user.id } }, select: { id: true } });
    if (!review) return fail("Revisão não encontrada.", 404);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0);
    await prisma.revisao.update({ where: { id }, data: { agendadaPara: tomorrow } });
    return ok(null, "Revisão adiada para amanhã.");
  } catch (error) { return handleApiError(error); }
}
