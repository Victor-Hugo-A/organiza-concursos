import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError } from "@/lib/api-response";
import { readMaterialPdf } from "@/lib/material-files";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para acessar o material.", 401);

    const { id } = await params;
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id },
      select: { nomeArquivo: true, urlArquivo: true }
    });
    if (!material?.urlArquivo) return fail("Arquivo não encontrado.", 404);

    const bytes = await readMaterialPdf(material.urlArquivo, user.id);
    const filename = (material.nomeArquivo ?? "material.pdf")
      .replaceAll(/[^a-zA-Z0-9._ -]/g, "_")
      .slice(0, 150);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename || "material.pdf"}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
