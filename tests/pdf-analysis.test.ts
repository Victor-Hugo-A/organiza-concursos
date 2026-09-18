import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzePdf, PdfAnalysisError } from "../lib/pdf-analysis";
import { isPdf, readMaterialPdf } from "../lib/material-files";
import { summarizePages } from "../lib/study-summary";
import { createTextPdf } from "./pdf-fixture";

const biology = [
  ["BIOLOGIA CELULAR", "A membrana plasmática regula a entrada e a saída de substâncias na célula.", "A membrana plasmática apresenta permeabilidade seletiva e protege o citoplasma.", "O transporte ativo consome energia para mover substâncias contra o gradiente."],
  ["RESPIRAÇÃO CELULAR", "As mitocôndrias participam da respiração celular e produzem energia para as células.", "A respiração celular transforma nutrientes em energia utilizada pelo organismo.", "O núcleo celular armazena o DNA e controla a atividade da célula."],
];

test("PDF real comprimido: resumo e termos em português, sem chave ou chamadas externas", async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  globalThis.fetch = async () => { throw new Error("A análise não deve acessar APIs"); };
  try {
    const result = await analyzePdf(createTextPdf(biology), "Biologia");
    assert.equal(result.paginas, 2);
    assert.match(result.resumo, /\(p\. [12]\)/);
    assert.ok(result.palavrasChave.some((term) => /membrana plasmática|respiração celular/.test(term)), result.palavrasChave.join(", "));
    assert.ok(result.pontosEstudo.length > 0);
    assert.ok(result.palavrasChave.every((term) => biology.flat().join(" ").toLowerCase().includes(term)));
    for (const passage of result.resumo.split("\n\n")) {
      assert.ok(biology.flat().includes(passage.replace(/ \(p\. \d+\)$/, "")), passage);
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("matéria informada não inventa temas ausentes do documento", async () => {
  const lines = [["INTERPRETAÇÃO", "A coesão textual estabelece conexões entre as partes de um enunciado.", "A coesão textual utiliza pronomes e conectivos para relacionar as informações.", "A coerência depende da compatibilidade entre as ideias apresentadas pelo autor."]];
  const result = await analyzePdf(createTextPdf(lines), "Geometria espacial");
  assert.ok(result.palavrasChave.includes("coesão textual"));
  assert.doesNotMatch(result.resumo, /geometria|mitocôndria/i);
  assert.ok(!result.palavrasChave.some((word) => /geometria|espacial/.test(word)));
});

test("páginas sem texto não recebem resumos fabricados", async () => {
  await assert.rejects(analyzePdf(createTextPdf([[]])), (error: unknown) => error instanceof PdfAnalysisError && error.message.includes("OCR"));
});

test("documento misto informa páginas excluídas e mantém referências reais", async () => {
  const result = await analyzePdf(createTextPdf([[], ...biology]));
  assert.match(result.resumo, /2 de 3 páginas/);
  assert.doesNotMatch(result.resumo, /\(p\. 1\)/);
});

test("arquivo corrompido retorna erro compreensível", async () => {
  await assert.rejects(analyzePdf(Buffer.from("%PDF-1.7\nquebrado")), (error: unknown) => error instanceof PdfAnalysisError && /estrutura|processar/.test(error.message));
});

test("limite de páginas recusa análise incompleta silenciosa", async () => {
  await assert.rejects(analyzePdf(createTextPdf(Array.from({ length: 201 }, () => []))), /mais de 200 páginas/);
});

test("cabeçalhos repetidos e perguntas não viram afirmações no resumo", () => {
  const pages = Array.from({ length: 3 }, (_, index) => ({ page: index + 1, text: `CURSO PREPARATÓRIO EXCLUSIVO\n\n${biology[index % 2].slice(1).join("\n\n")}\n\nQual organela produz energia nas células?\n\nPágina ${index + 1}` }));
  const result = summarizePages(pages)!;
  assert.ok(result);
  assert.doesNotMatch(result.resumo, /CURSO PREPARATÓRIO|Qual organela|Página \d/);
  assert.equal(new Set(result.resumo.split("\n\n").map((part) => part.replace(/ \(p\. \d+\)$/, ""))).size, result.resumo.split("\n\n").length);
  assert.ok(!result.palavrasChave.some((word) => /preparatório|exclusivo/.test(word)));
});

test("referências de banca não viram palavras-chave", () => {
  const result = summarizePages([{ page: 1, text: "CEBRASPE/IRBR/TERCEIRO SECRETÁRIO/2025 Segundo as ideias do texto, marque a alternativa correta.\n\nLINGUAGEM E SENTIDO\n\nA linguagem organiza sentidos e permite a interação entre os interlocutores.\n\nA interpretação depende das relações entre as informações do texto." }])!;
  assert.ok(result.palavrasChave.some((word) => /linguagem|sentido|interpretação/.test(word)));
  assert.ok(!result.palavrasChave.some((word) => /cebraspe|irbr|secretário/.test(word)));
  assert.doesNotMatch(result.resumo, /CEBRASPE|marque a alternativa/i);
});

test("leitura bloqueia caminhos de outra conta e hosts externos", async () => {
  await assert.rejects(readMaterialPdf("https://example.com/arquivo.pdf", "user-a"));
  await assert.rejects(readMaterialPdf("https://example.public.blob.vercel-storage.com/materiais/user-b/a.pdf", "user-a"));
  await assert.rejects(readMaterialPdf("/uploads/user-a/../user-b/a.pdf", "user-a"));
  await assert.rejects(readMaterialPdf("/uploads/user-a/..\\user-b\\a.pdf", "user-a"));
});

test("assinatura PDF e limite de 4 MB", () => {
  assert.ok(isPdf(createTextPdf(biology)));
  assert.equal(isPdf(Buffer.from("arquivo renomeado.pdf")), false);
  assert.equal(isPdf(Buffer.alloc(0)), false);
  assert.equal(isPdf(Buffer.concat([Buffer.from("%PDF-1.7"), Buffer.alloc(4 * 1024 * 1024)])), false);
});
