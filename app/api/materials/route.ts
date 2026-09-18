import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { parseTags, safeFileName } from "@/lib/strings";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Sessão inválida.", 401);
    const form = await request.formData();
    const file = form.get("arquivo");
    const titulo = String(form.get("titulo") ?? "").trim();
    const planoId = String(form.get("planoId") ?? "").trim() || null;
    const tags = parseTags(String(form.get("tags") ?? ""));

    if (!(file instanceof File) || file.type !== "application/pdf") return fail("Selecione um arquivo PDF válido.", 400);
    if (!titulo || titulo.length > 150) return fail("Informe um título válido.", 400);
    if (file.size > MAX_FILE_SIZE) return fail("O PDF deve ter no máximo 4 MB.", 400);
    if (planoId) {
      const plano = await prisma.planoEstudo.findFirst({ where: { id: planoId, usuarioId: user.id } });
      if (!plano) return fail("Plano inválido.", 400);
    }

    const cleanName = safeFileName(file.name);
    let urlArquivo: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`materiais/${user.id}/${randomUUID()}-${cleanName}`, file, { access: "public" });
      urlArquivo = blob.url;
    } else {
      const uploadDir = path.join(process.cwd(), "public", "uploads", user.id);
      await mkdir(uploadDir, { recursive: true });
      const storedName = `${randomUUID()}-${cleanName}`;
      await writeFile(path.join(uploadDir, storedName), Buffer.from(await file.arrayBuffer()));
      urlArquivo = `/uploads/${user.id}/${storedName}`;
    }

    const material = await prisma.materialEstudo.create({
      data: {
        usuarioId: user.id,
        planoId,
        titulo,
        nomeArquivo: cleanName,
        urlArquivo,
        tamanhoBytes: file.size,
        palavrasChave: { create: tags.map((termo) => ({ termo })) }
      },
      include: { plano: true, palavrasChave: true }
    });
    return created(material, "Material salvo.");
  } catch (error) {
    return handleApiError(error);
  }
}
