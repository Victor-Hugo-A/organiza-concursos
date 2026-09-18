import path from "node:path";
import { Worker } from "node:worker_threads";
import { summarizePages, type PdfPageText } from "@/lib/study-summary";

export class PdfAnalysisError extends Error {}

const parserMessages: Record<string, string> = {
  PASSWORD: "Este PDF está protegido por senha. Envie uma cópia sem senha para gerar o resumo.",
  TOO_MANY_PAGES: "Este PDF tem mais de 200 páginas. Divida-o em capítulos menores para gerar resumos mais úteis.",
  TOO_MUCH_TEXT: "Este PDF contém texto demais para uma única análise. Divida-o em capítulos menores.",
  INVALID_PDF: "Não foi possível ler a estrutura deste PDF. Exporte uma nova cópia como PDF e tente novamente.",
};

export async function analyzePdf(bytes: Buffer, subject = "") {
  const pages = await new Promise<PdfPageText[]>((resolve, reject) => {
    const worker = new Worker(path.join(process.cwd(), "scripts", "extract-pdf.mjs"), {
      workerData: { bytes: new Uint8Array(bytes) },
      execArgv: [],
      resourceLimits: { maxOldGenerationSizeMb: 192, maxYoungGenerationSizeMb: 32 },
    });
    let settled = false;
    const finish = (error?: Error, result?: PdfPageText[]) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      void worker.terminate().catch(() => undefined);
      if (error) reject(error); else resolve(result!);
    };
    const timer = setTimeout(() => finish(new PdfAnalysisError("A leitura deste PDF excedeu o tempo disponível. Divida o arquivo em capítulos menores e tente novamente.")), 30000);
    worker.once("message", (result: { success: boolean; pages?: PdfPageText[]; code?: string }) => {
      if (result.success && result.pages) finish(undefined, result.pages);
      else finish(new PdfAnalysisError(parserMessages[result.code ?? ""] ?? parserMessages.INVALID_PDF));
    });
    worker.once("error", () => finish(new PdfAnalysisError("Não foi possível processar este PDF. Tente um arquivo menor ou uma nova cópia do documento.")));
    worker.once("exit", () => { if (!settled) finish(new PdfAnalysisError("A leitura do PDF foi interrompida. Tente novamente com um capítulo menor.")); });
  });
  const analysis = summarizePages(pages, subject);
  if (!analysis) throw new PdfAnalysisError("Não encontramos texto suficiente para um resumo. Se o PDF for uma digitalização ou imagem, use reconhecimento de texto (OCR) e envie uma versão com texto selecionável.");
  return analysis;
}
