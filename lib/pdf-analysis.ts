import path from "node:path";
import { Worker } from "node:worker_threads";
import { summarizePages, type PdfPageText } from "@/lib/study-summary";

export class PdfAnalysisError extends Error {}

const parserMessages: Record<string, string> = {
  PASSWORD: "Este PDF está protegido por senha. Envie uma cópia sem senha para gerar o resumo.",
  TOO_MANY_PAGES: "Este PDF tem mais de 800 páginas. Divida-o em partes para manter uma síntese útil e concluída dentro do tempo disponível.",
  TOO_MANY_OCR_PAGES: "Este PDF tem mais de 80 páginas que precisam de OCR. Divida as páginas digitalizadas em partes de até 80 páginas e tente novamente.",
  TOO_MUCH_TEXT: "Este PDF contém texto demais para uma única análise. Divida-o em capítulos menores.",
  INVALID_PDF: "Não foi possível ler a estrutura deste PDF. Exporte uma nova cópia como PDF e tente novamente.",
};

export async function analyzePdf(bytes: Buffer, subject = "") {
  const pages = await new Promise<PdfPageText[]>((resolve, reject) => {
    const worker = new Worker(path.join(process.cwd(), "scripts", "extract-pdf.mjs"), {
      workerData: { bytes: new Uint8Array(bytes) },
      execArgv: [],
      resourceLimits: { maxOldGenerationSizeMb: 384, maxYoungGenerationSizeMb: 64 },
    });
    let settled = false;
    const finish = (error?: Error, result?: PdfPageText[]) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      void worker.terminate().catch(() => undefined);
      if (error) reject(error); else resolve(result!);
    };
    const timer = setTimeout(() => finish(new PdfAnalysisError("A leitura deste PDF excedeu o tempo disponível. Para arquivos digitalizados, envie partes menores e tente novamente.")), 105000);
    worker.once("message", (result: { success: boolean; pages?: PdfPageText[]; code?: string }) => {
      if (result.success && result.pages) finish(undefined, result.pages);
      else finish(new PdfAnalysisError(parserMessages[result.code ?? ""] ?? parserMessages.INVALID_PDF));
    });
    worker.once("error", () => finish(new PdfAnalysisError("Não foi possível processar este PDF. Tente um arquivo menor ou uma nova cópia do documento.")));
    worker.once("exit", () => { if (!settled) finish(new PdfAnalysisError("A leitura do PDF foi interrompida. Tente novamente com um capítulo menor.")); });
  });
  const analysis = summarizePages(pages, subject);
  if (!analysis) throw new PdfAnalysisError("Não encontramos texto suficiente para um resumo, mesmo após a leitura por OCR. Verifique se as páginas estão legíveis e tente uma cópia mais nítida.");
  return analysis;
}
