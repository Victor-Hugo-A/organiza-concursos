import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { put, del } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { created, fail, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { safeFileName } from "@/lib/strings";
import { isPdf, MAX_PDF_SIZE } from "@/lib/material-files";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let cleanup: (() => Promise<unknown>) | undefined;
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Sessão inválida.", 401);
    const form = await request.formData();
    const file = form.get("arquivo");
    const titulo = String(form.get("titulo") ?? "").trim();
    const materiaId = String(form.get("materiaId") ?? "").trim();

    if (!(file instanceof File) || file.type !== "application/pdf")
      return fail("Selecione um arquivo PDF válido.", 400);
    if (!titulo || titulo.length > 150)
      return fail("Informe um título válido.", 400);
    if (!file.size || file.size > MAX_PDF_SIZE)
      return fail("Escolha um PDF com conteúdo e tamanho de até 4 MB.", 400);
    if (!materiaId)
      return fail("Abra ou crie uma matéria antes de adicionar o PDF.", 400);
    const materia = await prisma.materiaEstudo.findFirst({
      where: { id: materiaId, plano: { usuarioId: user.id, arquivado: false } },
    });
    if (!materia)
      return fail(
        "A matéria selecionada não está disponível na sua conta.",
        404,
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!isPdf(bytes))
      return fail(
        "Este arquivo não é um PDF válido. Exporte o documento como PDF e tente novamente.",
      );
    if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN)
      return fail(
        "O envio de arquivos está temporariamente indisponível. Tente novamente mais tarde.",
        503,
      );

    const cleanName = safeFileName(file.name);
    let urlArquivo: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(
        `materiais/${user.id}/${randomUUID()}-${cleanName}`,
        file,
        { access: "public" },
      );
      urlArquivo = blob.url;
      cleanup = () => del(blob.url);
    } else {
      const uploadDir = path.join(process.cwd(), "public", "uploads", user.id);
      await mkdir(uploadDir, { recursive: true });
      const storedName = `${randomUUID()}-${cleanName}`;
      await writeFile(path.join(uploadDir, storedName), bytes);
      cleanup = () => unlink(path.join(uploadDir, storedName));
      urlArquivo = `/uploads/${user.id}/${storedName}`;
    }

    const material = await prisma.materialEstudo.create({
      data: {
        usuarioId: user.id,
        planoId: materia.planoId,
        materiaId: materia.id,
        titulo,
        nomeArquivo: cleanName,
        urlArquivo,
        tamanhoBytes: file.size,
      },
      include: { plano: true, palavrasChave: true },
    });
    cleanup = undefined;
    return created(
      material,
      `PDF salvo em ${materia.titulo}. Preparando o resumo e as palavras-chave.`,
    );
  } catch (error) {
    if (cleanup) await cleanup().catch(() => undefined);
    return handleApiError(error);
  }
}
