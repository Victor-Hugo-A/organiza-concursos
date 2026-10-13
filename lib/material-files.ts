import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { del, get } from "@vercel/blob";
import { PdfAnalysisError } from "@/lib/pdf-analysis";

export const MAX_PDF_SIZE = 4 * 1024 * 1024;

function getBlobAccess(url: URL): "public" | "private" {
  if (url.protocol !== "https:" || !url.hostname.endsWith(".blob.vercel-storage.com")) {
    throw new Error("Origem de material inválida.");
  }
  return url.hostname.endsWith(".public.blob.vercel-storage.com") ? "public" : "private";
}

function assertMaterialBlobPath(url: URL, usuarioId: string) {
  if (!url.pathname.startsWith(`/materiais/${usuarioId}/`)) {
    throw new Error("Origem de material inválida.");
  }
}

export function isPdf(bytes: Buffer) {
  return (
    bytes.length > 5 &&
    bytes.length <= MAX_PDF_SIZE &&
    bytes.subarray(0, 5).toString("ascii") === "%PDF-"
  );
}

export async function readMaterialPdf(url: string, usuarioId: string) {
  let bytes: Buffer;
  if (url.startsWith(`/uploads/${usuarioId}/`)) {
    const directory = path.resolve(process.cwd(), "public", "uploads", usuarioId);
    const filename = url.slice(`/uploads/${usuarioId}/`.length);
    if (filename !== path.basename(filename) || filename.includes("\\"))
      throw new Error("Caminho de material inválido.");
    bytes = await readFile(path.join(directory, filename));
  } else {
    const remote = new URL(url);
    const access = getBlobAccess(remote);
    assertMaterialBlobPath(remote, usuarioId);
    if (
      remote.protocol !== "https:" ||
      !remote.hostname.endsWith(".blob.vercel-storage.com") ||
      !remote.pathname.startsWith(`/materiais/${usuarioId}/`)
    )
      throw new Error("Origem de material inválida.");
    const response =
      access === "private"
        ? new Response((await get(remote.toString(), { access, useCache: false }))?.stream)
        : await fetch(remote, {
            signal: AbortSignal.timeout(15000),
            redirect: "error",
            cache: "no-store"
          });
    if (!response.ok || !response.body) throw new Error("Arquivo indisponível.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_PDF_SIZE) throw new Error("Arquivo muito grande.");
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    bytes = Buffer.concat(chunks);
  }
  if (!isPdf(bytes))
    throw new PdfAnalysisError(
      "O arquivo salvo não é um PDF válido de até 4 MB. Adicione uma nova cópia do documento."
    );
  return bytes;
}

export async function deleteMaterialFile(url: string, usuarioId: string) {
  if (url.startsWith(`/uploads/${usuarioId}/`)) {
    const directory = path.resolve(process.cwd(), "public", "uploads", usuarioId);
    const filename = url.slice(`/uploads/${usuarioId}/`.length);
    if (filename !== path.basename(filename) || filename.includes("\\"))
      throw new Error("Caminho de material inválido.");
    await unlink(path.join(directory, filename)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    return;
  }
  const remote = new URL(url);
  getBlobAccess(remote);
  assertMaterialBlobPath(remote, usuarioId);
  if (
    remote.protocol !== "https:" ||
    !remote.hostname.endsWith(".blob.vercel-storage.com") ||
    !remote.pathname.startsWith(`/materiais/${usuarioId}/`)
  )
    throw new Error("Origem de material inválida.");
  await del(remote.toString());
}
