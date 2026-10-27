import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzePdf, PdfAnalysisError } from "../lib/pdf-analysis";
import {
  getSupportedImageMimeType,
  isPdf,
  isSupportedImage,
  readMaterialPdf,
} from "../lib/material-files";
import { summarizePages } from "../lib/study-summary";
import { extractPdfExercises } from "../lib/pdf-exercises";
import { parsePdfByteRange } from "../lib/pdf-range";
import { createTextPdf } from "./pdf-fixture";

const biology = [
  [
    "BIOLOGIA CELULAR",
    "A membrana plasmática regula a entrada e a saída de substâncias na célula.",
    "A membrana plasmática apresenta permeabilidade seletiva e protege o citoplasma.",
    "O transporte ativo consome energia para mover substâncias contra o gradiente.",
  ],
  [
    "RESPIRAÇÃO CELULAR",
    "As mitocôndrias participam da respiração celular e produzem energia para as células.",
    "A respiração celular transforma nutrientes em energia utilizada pelo organismo.",
    "O núcleo celular armazena o DNA e controla a atividade da célula.",
  ],
];

test("PDF real comprimido: resumo e termos em português, sem chave ou chamadas externas", async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  globalThis.fetch = async () => {
    throw new Error("A análise não deve acessar APIs");
  };
  try {
    const result = await analyzePdf(createTextPdf(biology), "Biologia");
    assert.equal(result.paginas, 2);
    assert.match(result.resumo, /\(p\. [12]\)/);
    assert.ok(
      result.palavrasChave.some((term) =>
        /membrana plasmática|respiração celular/.test(term),
      ),
      result.palavrasChave.join(", "),
    );
    assert.ok(result.pontosEstudo.length > 0);
    assert.ok(
      result.palavrasChave.every((term) =>
        biology.flat().join(" ").toLowerCase().includes(term),
      ),
    );
    assert.ok(
      result.palavrasChave.every((term) => term.trim().split(/\s+/).length >= 2),
      `Termos isolados não devem ser sugeridos: ${result.palavrasChave.join(", ")}`,
    );
    for (const passage of result.resumo
      .split("\n\n")
      .filter((part) => part.startsWith("• "))) {
      assert.ok(
        biology.flat().includes(passage.slice(2).replace(/ \(p\. \d+\)$/, "")),
        passage,
      );
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("matéria informada não inventa temas ausentes do documento", async () => {
  const lines = [
    [
      "INTERPRETAÇÃO",
      "A coesão textual estabelece conexões entre as partes de um enunciado.",
      "A coesão textual utiliza pronomes e conectivos para relacionar as informações.",
      "A coerência depende da compatibilidade entre as ideias apresentadas pelo autor.",
    ],
  ];
  const result = await analyzePdf(createTextPdf(lines), "Geometria espacial");
  assert.ok(result.palavrasChave.includes("coesão textual"));
  assert.doesNotMatch(result.resumo, /geometria|mitocôndria/i);
  assert.ok(
    !result.palavrasChave.some((word) => /geometria|espacial/.test(word)),
  );
});

test("páginas sem texto não recebem resumos fabricados", async () => {
  await assert.rejects(
    analyzePdf(createTextPdf([[]])),
    (error: unknown) =>
      error instanceof PdfAnalysisError && error.message.includes("OCR"),
  );
});

test("documento misto informa páginas excluídas e mantém referências reais", async () => {
  const result = await analyzePdf(createTextPdf([[], ...biology]));
  assert.match(result.resumo, /2 de 3 páginas/);
  assert.doesNotMatch(result.resumo, /\(p\. 1\)/);
});

test("arquivo corrompido retorna erro compreensível", async () => {
  await assert.rejects(
    analyzePdf(Buffer.from("%PDF-1.7\nquebrado")),
    (error: unknown) =>
      error instanceof PdfAnalysisError &&
      /estrutura|processar/.test(error.message),
  );
});

test("limite de páginas recusa análise incompleta silenciosa", async () => {
  await assert.rejects(
    analyzePdf(createTextPdf(Array.from({ length: 801 }, () => []))),
    /mais de 800 páginas/,
  );
});

test("documento com mais de 200 páginas é lido por inteiro", async () => {
  const pages = Array.from({ length: 201 }, (_, index) => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const topic = `tema${alphabet[Math.floor(index / alphabet.length)]}${alphabet[index % alphabet.length]}`;
    return [
      topic.toLocaleUpperCase("pt-BR"),
      `O estudo de ${topic} explica uma relação relevante para a compreensão do material.`,
      `A revisão de ${topic} ajuda a organizar os pontos importantes deste capítulo.`,
    ];
  });
  const result = await analyzePdf(createTextPdf(pages));
  assert.equal(result.paginas, 201);
  assert.match(result.resumo, /\(p\. [1-9]\)/);
  assert.match(result.resumo, /\(p\. (?:19[0-9]|20[01])\)/);
});

test("PDF de 108 páginas preserva contexto suficiente ao longo do documento", () => {
  const letters = (value: number) => {
    let result = "";
    for (let current = value; current > 0; current = Math.floor((current - 1) / 26)) {
      result = String.fromCharCode(97 + ((current - 1) % 26)) + result;
    }
    return result;
  };
  const pages = Array.from({ length: 108 }, (_, index) => {
    const topic = `conceito${letters(index + 1)}`;
    return {
      page: index + 1,
      text: `${topic.toLocaleUpperCase("pt-BR")}\n\nO estudo de ${topic} apresenta uma relação importante entre os elementos explicados neste capítulo.\n\nA aplicação de ${topic} ajuda a compreender os princípios e os efeitos descritos no material.`,
    };
  });
  const result = summarizePages(pages)!;
  const notes = result.resumo.split("\n\n").filter((part) => part.startsWith("• "));

  assert.ok(notes.length >= 50, `Trechos selecionados: ${notes.length}`);
  assert.ok(notes.some((note) => note.includes("(p. 1)")));
  assert.ok(notes.some((note) => /\(p\. 10[0-8]\)/.test(note)));
});

test("cabeçalhos repetidos e perguntas não viram afirmações no resumo", () => {
  const pages = Array.from({ length: 3 }, (_, index) => ({
    page: index + 1,
    text: `CURSO PREPARATÓRIO EXCLUSIVO\n\n${biology[index % 2].slice(1).join("\n\n")}\n\nQual organela produz energia nas células?\n\nPágina ${index + 1}`,
  }));
  const result = summarizePages(pages)!;
  assert.ok(result);
  assert.doesNotMatch(
    result.resumo,
    /CURSO PREPARATÓRIO|Qual organela|Página \d/,
  );
  assert.equal(
    new Set(
      result.resumo
        .split("\n\n")
        .map((part) => part.replace(/ \(p\. \d+\)$/, "")),
    ).size,
    result.resumo.split("\n\n").length,
  );
  assert.ok(
    !result.palavrasChave.some((word) => /preparatório|exclusivo/.test(word)),
  );
});

test("referências de banca não viram palavras-chave", () => {
  const result = summarizePages([
    {
      page: 1,
      text: "CEBRASPE/IRBR/TERCEIRO SECRETÁRIO/2025 Segundo as ideias do texto, marque a alternativa correta.\n\nLINGUAGEM E SENTIDO\n\nA linguagem organiza sentidos e permite a interação entre os interlocutores.\n\nA interpretação depende das relações entre as informações do texto.",
    },
  ])!;
  assert.ok(
    result.palavrasChave.some((word) =>
      /linguagem|sentido|interpretação/.test(word),
    ),
  );
  assert.ok(
    !result.palavrasChave.some((word) => /cebraspe|irbr|secretário/.test(word)),
  );
  assert.doesNotMatch(result.resumo, /CEBRASPE|marque a alternativa/i);
});

test("importa somente questões objetivas com gabarito explícito e página de origem", () => {
  const exercises = extractPdfExercises([
    {
      page: 12,
      text: [
        "QUESTÕES",
        "1. Qual alternativa descreve corretamente a função da membrana plasmática?",
        "A) Controla a entrada e saída de substâncias.",
        "B) Armazena o material genético.",
        "C) Produz energia para a célula.",
        "D) Sintetiza proteínas.",
        "2. Qual organela participa da respiração celular?",
        "A) Ribossomo.",
        "B) Mitocôndria.",
        "C) Lisossomo.",
        "D) Complexo golgiense.",
      ].join("\n"),
    },
    { page: 13, text: "GABARITO OFICIAL\n1-A\n2-B" },
  ]);

  assert.equal(exercises.length, 2);
  assert.equal(exercises[0].pagina, 12);
  assert.equal(exercises[0].respostaCorreta, "Controla a entrada e saída de substâncias.");
  assert.equal(exercises[1].respostaCorreta, "Mitocôndria.");
  assert.equal(exercises[0].explicacao, null);
});

test("não infere respostas quando o PDF não apresenta gabarito", () => {
  const exercises = extractPdfExercises([
    {
      page: 1,
      text: [
        "1. Qual alternativa descreve corretamente a função da membrana plasmática?",
        "A) Controla a entrada e saída de substâncias.",
        "B) Armazena o material genético.",
      ].join("\n"),
    },
  ]);

  assert.deepEqual(exercises, []);
});

test("resumo longo cobre o início, o meio e o fim do documento", () => {
  const topics = [
    "fotossíntese",
    "respiração",
    "citologia",
    "genética",
    "ecologia",
    "evolução",
    "cinemática",
    "dinâmica",
    "energia",
    "eletricidade",
    "geometria",
    "estatística",
    "coesão",
    "coerência",
    "argumentação",
    "sintaxe",
    "semântica",
    "literatura",
  ];
  const pages = topics.map((topic, index) => ({
    page: index + 1,
    text: `${topic.toLocaleUpperCase("pt-BR")}\n\nO estudo de ${topic} explica relações específicas entre elementos do conteúdo e suas consequências práticas.\n\nA aplicação de ${topic} permite revisar diferenças importantes apresentadas neste tema.`,
  }));
  const result = summarizePages(pages)!;
  const references = [...result.resumo.matchAll(/\(p\. (\d+)\)/g)].map(
    (match) => Number(match[1]),
  );
  assert.ok(result.resumo.startsWith("Síntese de leitura — 18 de 18 páginas"));
  assert.ok(
    references.some((page) => page <= 4),
    references.join(", "),
  );
  assert.ok(
    references.some((page) => page >= 8 && page <= 12),
    references.join(", "),
  );
  assert.ok(
    references.some((page) => page >= 15),
    references.join(", "),
  );
  assert.ok(result.pontosEstudo.length >= 6);
});

test("leitura bloqueia caminhos de outra conta e hosts externos", async () => {
  await assert.rejects(
    readMaterialPdf("https://example.com/arquivo.pdf", "user-a"),
  );
  await assert.rejects(
    readMaterialPdf(
      "https://example.public.blob.vercel-storage.com/materiais/user-b/a.pdf",
      "user-a",
    ),
  );
  await assert.rejects(
    readMaterialPdf(
      "https://example.blob.vercel-storage.com/materiais/user-b/a.pdf",
      "user-a",
    ),
  );
  await assert.rejects(
    readMaterialPdf("/uploads/user-a/../user-b/a.pdf", "user-a"),
  );
  await assert.rejects(
    readMaterialPdf("/uploads/user-a/..\\user-b\\a.pdf", "user-a"),
  );
});

test("assinatura PDF e limite de 4 MB", () => {
  assert.ok(isPdf(createTextPdf(biology)));
  assert.equal(isPdf(Buffer.from("arquivo renomeado.pdf")), false);
  assert.equal(isPdf(Buffer.alloc(0)), false);
  assert.equal(
    isPdf(
      Buffer.concat([Buffer.from("%PDF-1.7"), Buffer.alloc(4 * 1024 * 1024)]),
    ),
    false,
  );
});

test("reconhece imagens pelos bytes e não apenas pela extensão ou MIME informado", () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0]);
  const gif = Buffer.from("GIF89a");
  const webp = Buffer.from("RIFFxxxxWEBP");

  assert.equal(getSupportedImageMimeType(png), "image/png");
  assert.equal(getSupportedImageMimeType(jpeg), "image/jpeg");
  assert.equal(getSupportedImageMimeType(gif), "image/gif");
  assert.equal(getSupportedImageMimeType(webp), "image/webp");
  assert.equal(isSupportedImage(png, "image/png"), true);
  assert.equal(isSupportedImage(png, "image/jpeg"), false);
  assert.equal(getSupportedImageMimeType(Buffer.from("fake image")), null);
});

test("interpreta intervalos HTTP do leitor de PDF e rejeita intervalos inválidos", () => {
  assert.deepEqual(parsePdfByteRange("bytes=0-9", 100), { start: 0, end: 9 });
  assert.deepEqual(parsePdfByteRange("bytes=20-", 100), {
    start: 20,
    end: 99,
  });
  assert.deepEqual(parsePdfByteRange("bytes=-10", 100), {
    start: 90,
    end: 99,
  });
  assert.deepEqual(parsePdfByteRange("bytes=95-120", 100), {
    start: 95,
    end: 99,
  });
  assert.equal(parsePdfByteRange("bytes=100-", 100), null);
  assert.equal(parsePdfByteRange("bytes=8-2", 100), null);
  assert.equal(parsePdfByteRange("bytes=0-1,4-5", 100), null);
});
