import { getCurrentUser } from "@/lib/auth";
import { fail, handleApiError } from "@/lib/api-response";
import { getSupportedImageMimeType, isPdf, readMaterialFile } from "@/lib/material-files";
import { prisma } from "@/lib/prisma";
import { parsePdfByteRange } from "@/lib/pdf-range";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para acessar o material.", 401);

    const { id } = await params;
    const material = await prisma.materialEstudo.findFirst({
      where: { id, usuarioId: user.id },
      select: { nomeArquivo: true, urlArquivo: true, tipo: true }
    });
    if (!material?.urlArquivo) return fail("Arquivo não encontrado.", 404);

    const bytes = await readMaterialFile(material.urlArquivo, user.id);
    const contentType = material.tipo === "PDF" && isPdf(bytes)
      ? "application/pdf"
      : material.tipo === "IMAGEM"
        ? getSupportedImageMimeType(bytes)
        : null;
    if (!contentType) return fail("O arquivo salvo está inválido.", 422);
    const filename = (material.nomeArquivo ?? "material.pdf")
      .replaceAll(/[^a-zA-Z0-9._ -]/g, "_")
      .slice(0, 150);
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename || "material.pdf"}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    });
    if (contentType !== "application/pdf") {
      headers.set("Content-Length", String(bytes.length));
      return new Response(new Uint8Array(bytes), { headers });
    }
    const rangeHeader = _request.headers.get("range");
    if (!rangeHeader) {
      headers.set("Content-Length", String(bytes.length));
      return new Response(new Uint8Array(bytes), { headers });
    }

    const range = parsePdfByteRange(rangeHeader, bytes.length);
    if (!range) {
      headers.set("Content-Range", `bytes */${bytes.length}`);
      return new Response(null, { status: 416, headers });
    }

    const chunk = bytes.subarray(range.start, range.end + 1);
    headers.set("Content-Length", String(chunk.length));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${bytes.length}`);
    return new Response(new Uint8Array(chunk), { status: 206, headers });
  } catch (error) {
    return handleApiError(error);
  }
}
