// Isolated PDF parser. Invoked by lib/pdf-analysis.ts; no separate service is needed.
import { parentPort, workerData } from "node:worker_threads";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

const require = createRequire(import.meta.url);
const pdfRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
const MAX_PAGES = 800;
const MAX_CHARACTERS = 2_000_000;
const MAX_OCR_PAGES = 80;
const OCR_TEXT_THRESHOLD = 40;
const ocrCachePath = path.join(os.tmpdir(), "organiza-tesseract");

function pageText(items) {
  const lines = [];
  let line = { text: "", y: null, height: 0, x: 0 };
  const flush = () => {
    if (line.text.trim()) lines.push({ ...line, text: line.text.trim() });
    line = { text: "", y: null, height: 0, x: 0 };
  };
  for (const item of items) {
    if (!("str" in item)) continue;
    const y = item.transform[5];
    const height = Math.abs(item.height) || 12;
    if (line.y !== null && Math.abs(y - line.y) > Math.max(3, height * 0.5)) flush();
    if (line.y === null) { line.y = y; line.height = height; line.x = item.transform[4]; }
    const previous = line.endX;
    if (line.text && previous !== undefined && item.transform[4] - previous > height * 0.12 && !/\s$/.test(line.text)) line.text += " ";
    line.text += item.str;
    line.endX = item.transform[4] + item.width;
    if (item.hasEOL) flush();
  }
  flush();
  const heights = lines.map((value) => value.height).sort((a, b) => a - b);
  const typical = heights[Math.floor(heights.length / 2)] || 12;
  const blocks = [];
  let paragraph = "";
  for (let index = 0; index < lines.length; index++) {
    const current = lines[index];
    const previous = lines[index - 1];
    const heading = current.height > typical * 1.18 || (current.text.length < 100 && current.text === current.text.toLocaleUpperCase("pt-BR"));
    const boundary = heading || /^[•●▪–\-]\s/.test(current.text) || (previous && (Math.abs(current.y - previous.y) > typical * 1.9 || previous.height > typical * 1.18 || Math.abs(current.x - previous.x) > 100));
    if (boundary && paragraph) { blocks.push(paragraph); paragraph = ""; }
    if (paragraph.endsWith("-") && /^[a-zà-ÿ]/.test(current.text)) paragraph = paragraph.slice(0, -1) + current.text;
    else paragraph += (paragraph ? " " : "") + current.text;
    if (heading || /[.!?:;]$/.test(current.text)) { blocks.push(paragraph); paragraph = ""; }
  }
  if (paragraph) blocks.push(paragraph);
  return blocks.join("\n\n");
}

async function imageForOcr(documentPage) {
  const { createCanvas } = require("@napi-rs/canvas");
  const initial = documentPage.getViewport({ scale: 1 });
  const scale = Math.min(2, Math.max(1.35, 1600 / initial.width));
  const viewport = documentPage.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  await documentPage.render({ canvasContext: context, viewport, background: "#ffffff" }).promise;
  return canvas.toBuffer("image/png");
}

async function readWithOcr(documentPage, worker) {
  const image = await imageForOcr(documentPage);
  const result = await worker.recognize(image, {}, { text: true });
  return result.data.text.replace(/\r/g, "").trim();
}

async function hasRenderableImage(documentPage) {
  const operators = await documentPage.getOperatorList();
  const imageOperators = new Set([
    OPS.paintImageXObject,
    OPS.paintImageMaskXObject,
    OPS.paintSolidColorImageMask,
    OPS.paintJpegXObject,
  ]);
  return operators.fnArray.some((operator) => imageOperators.has(operator));
}

let task;
let ocrWorker;
try {
  task = getDocument({
    data: workerData.bytes,
    cMapUrl: path.join(pdfRoot, "cmaps").replaceAll("\\", "/") + "/",
    cMapPacked: true,
    standardFontDataUrl: path.join(pdfRoot, "standard_fonts").replaceAll("\\", "/") + "/",
    useWorkerFetch: false,
    useSystemFonts: false,
    disableFontFace: true,
    stopAtErrors: true,
    verbosity: 0,
  });
  const pdf = await task.promise;
  if (pdf.numPages > MAX_PAGES) throw new Error("TOO_MANY_PAGES");
  const pages = [];
  let characters = 0;
  let ocrPages = 0;
  for (let page = 1; page <= pdf.numPages; page++) {
    const documentPage = await pdf.getPage(page);
    const content = await documentPage.getTextContent();
    let text = pageText(content.items).normalize("NFKC");
    let source = "text";
    if (
      text.replace(/\s/g, "").length < OCR_TEXT_THRESHOLD &&
      await hasRenderableImage(documentPage)
    ) {
      if (ocrPages >= MAX_OCR_PAGES) throw new Error("TOO_MANY_OCR_PAGES");
      if (!ocrWorker) {
        const { createWorker } = require("tesseract.js");
        mkdirSync(ocrCachePath, { recursive: true });
        ocrWorker = await createWorker("por+eng", 1, {
          logger: () => {},
          cachePath: ocrCachePath,
        });
      }
      text = await readWithOcr(documentPage, ocrWorker);
      source = "ocr";
      ocrPages++;
    }
    characters += text.length;
    if (characters > MAX_CHARACTERS) throw new Error("TOO_MUCH_TEXT");
    pages.push({ page, text, source });
    documentPage.cleanup();
  }
  parentPort.postMessage({ success: true, pages });
} catch (error) {
  const code = error?.name === "PasswordException"
    ? "PASSWORD"
    : ["TOO_MANY_PAGES", "TOO_MANY_OCR_PAGES", "TOO_MUCH_TEXT"].includes(error?.message)
      ? error.message
      : "INVALID_PDF";
  parentPort.postMessage({ success: false, code });
} finally {
  await ocrWorker?.terminate().catch(() => undefined);
  await task?.destroy();
}
