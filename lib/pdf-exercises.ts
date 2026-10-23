import type { PdfPageText } from "@/lib/study-summary";

export type PdfExercise = {
  enunciado: string;
  alternativas: string[];
  respostaCorreta: string;
  explicacao: string | null;
  pagina: number;
};

type Line = { page: number; text: string };

const answerKeyHeading =
  /^\s*(?:gabarito(?:\s+(?:oficial|definitivo|comentado))?|respostas?(?:\s+oficiais?)?|chave\s+de\s+respostas?)\s*(?:[:\-–—.]|$)/i;
const commentaryHeading =
  /^(?:coment[aá]rios?|resolu[cç][õo]es?|quest[õo]es\s+comentadas|an[aá]lise\s+das\s+respostas)\b/i;
const questionHeading =
  /^\s*(?:(?:quest[aã]o|item)\s+)?(\d{1,3})\s*[.)\-:]\s*(.*)$/i;
const namedQuestionHeading = /^\s*(?:quest[aã]o|item)\s+(\d{1,3})\b(.*)$/i;
const optionHeading = /^\s*(?:\(([A-E])\)|([A-E])[).])\s*(.*)$/i;

function collectAnswerKey(pages: PdfPageText[]) {
  const answers = new Map<number, string>();
  let readingKey = false;
  let keyEnded = false;

  for (const page of pages) {
    for (const rawLine of page.text.split(/\n+/)) {
      const line = rawLine.trim();
      if (!line) continue;

      if (!keyEnded && answerKeyHeading.test(line)) readingKey = true;
      if (!readingKey) continue;
      if (commentaryHeading.test(line)) {
        readingKey = false;
        keyEnded = true;
        continue;
      }

      const inlinePairs =
        /(?:quest[aã]o|item)?\s*(\d{1,3})\s*(?:[.):\-–—]\s*|\s+)([A-E])(?=\s|$|[;,])/gi;
      for (const match of line.matchAll(inlinePairs)) {
        answers.set(Number(match[1]), match[2].toUpperCase());
      }
      const textualPair =
        /^\s*(?:quest[aã]o|item)?\s*(\d{1,3})\s*(?:=|:|[-–—])\s*(?:alternativa\s*)?([A-E])\s*$/i.exec(
          line,
        );
      if (textualPair) {
        answers.set(Number(textualPair[1]), textualPair[2].toUpperCase());
      }
    }
  }

  return answers;
}

function parseOptions(value: string) {
  const marker = /(?:^|\s)(?:\(([A-E])\)|([A-E])[).])\s+/gi;
  const matches = [...value.matchAll(marker)];
  if (matches.length < 2 || matches.length > 5) return null;

  const firstIndex = matches[0].index ?? 0;
  const enunciado = value.slice(0, firstIndex).trim();
  const alternatives = matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? value.length;
    return value.slice(start, end).trim();
  });
  const labels = matches.map((match) => (match[1] ?? match[2]).toUpperCase());

  if (
    enunciado.length < 10 ||
    labels.some((label, index) => label !== String.fromCharCode(65 + index)) ||
    alternatives.some((alternative) => alternative.length < 2)
  ) {
    return null;
  }

  return { enunciado, alternatives };
}

export function extractPdfExercises(pages: PdfPageText[]): PdfExercise[] {
  const answerKey = collectAnswerKey(pages);
  if (!answerKey.size) return [];

  const lines: Line[] = [];
  let reachedAnswerKey = false;
  for (const page of pages) {
    for (const text of page.text.split(/\n+/)) {
      const line = text.trim();
      if (answerKeyHeading.test(line)) {
        reachedAnswerKey = true;
        break;
      }
      if (!reachedAnswerKey && line) lines.push({ page: page.page, text: line });
    }
    if (reachedAnswerKey) break;
  }

  const exercises: PdfExercise[] = [];
  let current: { number: number; page: number; lines: string[] } | null = null;
  const saveCurrent = () => {
    if (!current) return;
    const parsed = parseOptions(current.lines.join(" "));
    const correctLabel = answerKey.get(current.number);
    if (!parsed || !correctLabel) return;
    const correctIndex = correctLabel.charCodeAt(0) - 65;
    if (correctIndex < 0 || correctIndex >= parsed.alternatives.length) return;

    exercises.push({
      enunciado: parsed.enunciado,
      alternativas: parsed.alternatives,
      respostaCorreta: parsed.alternatives[correctIndex],
      explicacao: null,
      pagina: current.page,
    });
  };

  for (const line of lines) {
    const named = namedQuestionHeading.exec(line.text);
    const numbered = questionHeading.exec(line.text);
    const number = named ? Number(named[1]) : numbered ? Number(numbered[1]) : null;
    const prompt = named
      ? named[2].replace(/^[\s).:\-–—]+/, "")
      : numbered?.[2];
    const hasQuestionStart =
      number !== null &&
      prompt !== undefined &&
      (named !== null || (prompt.length >= 10 && !optionHeading.test(line.text)));

    if (hasQuestionStart) {
      saveCurrent();
      current = { number, page: line.page, lines: prompt ? [prompt] : [] };
      continue;
    }
    if (current) current.lines.push(line.text);
  }
  saveCurrent();

  const seen = new Set<string>();
  return exercises.filter((exercise) => {
    const key = `${exercise.pagina}:${exercise.enunciado}:${exercise.alternativas.join("|")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
