import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  materialId: z.string().min(1),
  quando: z.enum(["AMANHA", "SETE_DIAS", "TRINTA_DIAS", "PERSONALIZADA"]),
  dataPersonalizada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function scheduledDate(input: z.infer<typeof schema>) {
  if (input.quando === "PERSONALIZADA") {
    if (!input.dataPersonalizada) return null;
    return new Date(`${input.dataPersonalizada}T09:00:00`);
  }
  const days = input.quando === "AMANHA" ? 1 : input.quando === "SETE_DIAS" ? 7 : 30;
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para agendar uma revisão.", 401);
    const input = schema.parse(await request.json());
    const date = scheduledDate(input);
    if (!date || Number.isNaN(date.getTime()))
      return fail("Informe uma data válida para a revisão.", 400);
    if (date < new Date(new Date().setHours(0, 0, 0, 0)))
      return fail("Escolha uma data de hoje em diante.", 400);

    const material = await prisma.materialEstudo.findFirst({
      where: { id: input.materialId, usuarioId: user.id },
      include: { materia: { select: { titulo: true } } },
    });
    if (!material) return fail("Material não encontrado na sua conta.", 404);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const duplicate = await prisma.revisao.findFirst({
      where: {
        materialId: material.id,
        status: "PENDENTE",
        agendadaPara: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true },
    });
    if (duplicate)
      return fail("Este material já possui uma revisão pendente nessa data.", 409);

    const review = await prisma.revisao.create({
      data: {
        materialId: material.id,
        titulo: `Revisão manual · ${material.titulo}`,
        agendadaPara: date,
        origem: "MANUAL",
      },
    });
    return created(
      review,
      `Revisão de ${material.materia?.titulo ?? "material"} agendada para ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date)}.`,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
