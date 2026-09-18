import { readFile } from "node:fs/promises";
import path from "node:path";
import { PdfAnalysisError } from "@/lib/pdf-analysis";

export const MAX_PDF_SIZE = 4 * 1024 * 1024;

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
    const directory = path.resolve(
      process.cwd(),
      "public",
      "uploads",
      usuarioId,
    );
    const filename = url.slice(`/uploads/${usuarioId}/`.length);
    if (filename !== path.basename(filename) || filename.includes("\\"))
      throw new Error("Caminho de material inválido.");
    bytes = await readFile(path.join(directory, filename));
  } else {
    const remote = new URL(url);
    if (
      remote.protocol !== "https:" ||
      !remote.hostname.endsWith(".public.blob.vercel-storage.com") ||
      !remote.pathname.startsWith(`/materiais/${usuarioId}/`)
    )
      throw new Error("Origem de material inválida.");
    const response = await fetch(remote, {
      signal: AbortSignal.timeout(15000),
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok || !response.body)
      throw new Error("Arquivo indisponível.");
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
      "O arquivo salvo não é um PDF válido de até 4 MB. Adicione uma nova cópia do documento.",
    );
  return bytes;
}
