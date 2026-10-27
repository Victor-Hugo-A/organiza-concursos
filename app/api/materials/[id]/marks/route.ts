import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const positionSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
    redondo: z.boolean().optional(),
  })
  .refine(({ x, y, width, height }) => x + width <= 1 && y + height <= 1);

const schema = z.object({
  pagina: z.number().int().min(1).max(10000),
  texto: z.string().trim().min(1).max(3000),
  estilo: z.enum(["REALCE", "SUBLINHADO"]),
  cor: z.string().regex(/^#[\da-fA-F]{6}$/),
  posicoes: z.array(positionSchema).min(1).max(2000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para acessar as marcações.", 401);
    const { id } = await params;
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id },
      select: { id: true },
    });
    if (!material) return fail("Material não encontrado na sua conta.", 404);
    const marks = await prisma.marcacaoMaterial.findMany({
      where: { materialId: id },
      orderBy: { criadoEm: "asc" },
    });
    return ok(marks);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para salvar marcações.", 401);
    const { id } = await params;
    const input = schema.parse(await request.json());
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id, tipo: "PDF" },
      select: { id: true, paginas: true },
    });
    if (!material) return fail("PDF não encontrado na sua conta.", 404);
    if (material.paginas && input.pagina > material.paginas)
      return fail("A página selecionada não existe neste PDF.", 400);
    const mark = await prisma.marcacaoMaterial.create({
      data: { ...input, materialId: id },
    });
    return created(mark, "Marcação salva no PDF.");
  } catch (error) {
    return handleApiError(error);
  }
}
