export type PdfPageText = { page: number; text: string };

// Portuguese function words, common instructions and publishing boilerplate do not
// identify a subject. Keep the original spelling for terms displayed to students.
const stopWords = new Set(`a ao aos aquela aquelas aquele aqueles aquilo as ate com como da das de dela delas dele deles depois dessa dessas desse desses desta destas deste destes do dos e ela elas ele eles em entre era eram essa essas esse esses esta estas este estes eu foi foram ha isso isto ja la lhe lhes mais mas me mesmo meu meus minha minhas muito na nas nao nem no nos nossa nossas nosso nossos num numa o os ou para pela pelas pelo pelos por porque qual quais quando que quem se sem ser sera seu seus sua suas sao so sobre tambem te tem temos ter teve tipo toda todas todo todos tu um uma umas uns voce voces pode podem podemos deve devem devera sendo sido seja sejam sao esta estao estas estavam estava sao sao sao sao sao texto textos exemplo exemplos questao questoes alternativa alternativas assinale correta correto incorreta incorreto resposta respostas gabarito exercicio exercicios atividade atividades aula aulas pagina paginas professor professora aluno alunos material materiais conteudo conteudos capitulo unidade introducao conclusao objetivo objetivos estudo estudos observe veja seguir abaixo acima acordo forma maneira atraves partir cada caso casos ainda assim apenas tanto quanto portanto porem pois entao alem durante antes apos dentro fora segundo primeira primeiro parte partes etc www http https direitos reservados autor autora editora curso cursos pdf slide slides todos copyright`.split(/\s+/));
const connectors = new Set(["de", "da", "do", "das", "dos"]);
const normalize = (value: string) => value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const words = (value: string) => value.match(/[\p{L}][\p{L}\p{M}-]*/gu) ?? [];
const significant = (value: string) => value.length >= 3 && !stopWords.has(normalize(value));
const sentenceSegmenter = new Intl.Segmenter("pt-BR", { granularity: "sentence" });

type Sentence = { text: string; page: number; index: number; terms: Set<string>; score: number };
type Term = { label: string; count: number; pages: Set<number>; heading: boolean; size: number; score: number };

function cleanPages(pages: PdfPageText[]) {
  const recurring = new Map<string, Set<number>>();
  for (const page of pages) {
    const blocks = page.text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    for (const line of [...blocks.slice(0, 2), ...blocks.slice(-2)]) {
      if (line.length > 130) continue;
      const key = normalize(line).replace(/\d+/g, "#");
      const occurrences = recurring.get(key) ?? new Set<number>();
      occurrences.add(page.page); recurring.set(key, occurrences);
    }
  }
  return pages.map((page) => ({ ...page, text: page.text.replace(/\u00ad/g, "").split(/\n+/).filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || /^(?:p[aá]g(?:ina)?\.?\s*)?\d+(?:\s*(?:\/|de)\s*\d+)?$/i.test(trimmed)) return false;
    if (/https?:\/\/|www\.|@|todos os direitos reservados|livro eletr[oô]nico.*licenciado|vedada.*reprodu[cç][aã]o|responsabiliza[cç][aã]o civil|c[oó]pia.*divulga[cç][aã]o.*distribui[cç][aã]o/i.test(trimmed)) return false;
    const count = recurring.get(normalize(trimmed).replace(/\d+/g, "#"))?.size ?? 0;
    return !(count >= 3 && count >= pages.length * 0.6 && trimmed.length <= 130);
  }).join("\n\n") }));
}

export function summarizePages(pages: PdfPageText[], subject = "") {
  const clean = cleanPages(pages);
  const vocabulary = new Map<string, Term>();
  const sentences: Sentence[] = [];
  const seenSentences = new Set<string>();
  const context = new Set(words(subject).filter(significant).map(normalize));
  const addTerm = (label: string, page: number, heading: boolean, size: number) => {
    if (label.length > 75) return;
    const key = normalize(label);
    const term = vocabulary.get(key) ?? { label: label.toLocaleLowerCase("pt-BR"), count: 0, pages: new Set<number>(), heading: false, size, score: 0 };
    term.count++; term.pages.add(page); term.heading ||= heading;
    vocabulary.set(key, term);
  };
  for (const page of clean) {
    for (const block of page.text.split(/\n+/).filter(Boolean)) {
      const heading = block.length < 100 && !/[.!?]$/.test(block);
      // Punctuation forms a boundary: phrases never join unrelated clauses.
      for (const fragment of block.split(/[.,;:!?()[\]{}\n]/)) {
        const tokens = words(fragment);
        for (let index = 0; index < tokens.length; index++) {
          if (!significant(tokens[index])) continue;
          addTerm(tokens[index], page.page, heading, 1);
          if (tokens[index + 1] && significant(tokens[index + 1])) addTerm(tokens.slice(index, index + 2).join(" "), page.page, heading, 2);
          if (connectors.has(normalize(tokens[index + 1] ?? "")) && tokens[index + 2] && significant(tokens[index + 2])) addTerm(tokens.slice(index, index + 3).join(" "), page.page, heading, 2);
        }
      }
      for (const segment of sentenceSegmenter.segment(block)) {
        const text = segment.segment.trim().replace(/^[•●▪–\-]\s*/, "");
        const tokens = words(text);
        const terms = new Set(tokens.filter(significant).map(normalize));
        const key = normalize(text);
        if (text.length < 35 || text.length > 1400 || tokens.length < 7 || terms.size < 3 || seenSentences.has(key)) continue;
        // Do not select questions or multiple-choice options as factual study notes.
        if (/\?$|^[a-eA-E][).]\s|^(?:assinale|marque|qual|quais|julgue|segundo as ideias|da leitura|afirma-se|entende-se)\b/i.test(text)) continue;
        seenSentences.add(key);
        sentences.push({ text, page: page.page, index: sentences.length, terms, score: 0 });
      }
    }
  }
  if (!sentences.length || vocabulary.size < 5) return null;
  for (const [key, term] of vocabulary) {
    const recurrence = 1 + Math.log2(term.count);
    term.score = recurrence * (1 + Math.log2(term.pages.size)) * (term.heading ? 1.4 : 1) * (context.has(key) ? 1.15 : 1);
    if (term.size > 1) {
      // Recurring phrases are more useful than an isolated pair of adjacent words.
      term.score *= term.count >= 2 || term.heading ? 1.9 : 0.45;
    }
  }
  const rankedTerms = [...vocabulary.entries()].sort((a, b) => b[1].score - a[1].score || a[0].localeCompare(b[0], "pt-BR"));
  const keywords: string[] = [];
  const selectedTermSets: Set<string>[] = [];
  for (const [, term] of rankedTerms) {
    const terms = new Set(words(term.label).filter(significant).map(normalize));
    if (selectedTermSets.some((selected) => [...terms].every((token) => selected.has(token)) || [...selected].every((token) => terms.has(token)))) continue;
    keywords.push(term.label); selectedTermSets.push(terms);
    if (keywords.length >= 12) break;
  }
  for (const sentence of sentences) {
    sentence.score = [...sentence.terms].reduce((sum, token) => sum + (vocabulary.get(token)?.score ?? 0), 0) / Math.sqrt(sentence.terms.size);
    if (/\b(?:é|são|consiste|significa|caracteriza|define|ocorre|permite|representa)\b/i.test(sentence.text)) sentence.score *= 1.15;
  }
  const candidates = [...sentences].sort((a, b) => b.score - a.score).slice(0, 1500);
  const selected: Sentence[] = [];
  const pageCounts = new Map<number, number>();
  const target = Math.min(8, Math.max(2, Math.ceil(sentences.length * 0.22)));
  let characters = 0;
  while (selected.length < target && candidates.length) {
    let bestIndex = -1; let bestScore = -1;
    for (let index = 0; index < candidates.length; index++) {
      const candidate = candidates[index];
      if (characters + candidate.text.length > 5000) continue;
      const similarity = Math.max(0, ...selected.map((previous) => {
        const overlap = [...candidate.terms].filter((token) => previous.terms.has(token)).length;
        return overlap / Math.min(candidate.terms.size, previous.terms.size);
      }));
      if (similarity > 0.8) continue;
      const score = candidate.score * (1 - 0.75 * similarity) / (1 + (pageCounts.get(candidate.page) ?? 0) * 0.4);
      if (score > bestScore) { bestScore = score; bestIndex = index; }
    }
    if (bestIndex < 0) break;
    const [next] = candidates.splice(bestIndex, 1);
    selected.push(next); characters += next.text.length;
    pageCounts.set(next.page, (pageCounts.get(next.page) ?? 0) + 1);
  }
  selected.sort((a, b) => a.page - b.page || a.index - b.index);
  if (!selected.length || !keywords.length) return null;
  const readablePages = pages.filter((page) => words(page.text).length >= 5).length;
  const partial = readablePages < pages.length ? `Resumo apenas das ${readablePages} de ${pages.length} páginas com texto extraível. Páginas sem texto podem conter imagens ou digitalizações e não estão incluídas.\n\n` : "";
  const notes = selected.map((sentence) => `${sentence.text} (p. ${sentence.page})`);
  // Each review point links a relevant keyword to an actual passage, rather than
  // inventing explanations from a term list or inferring exam frequency.
  const reviewPoints: string[] = [];
  const usedEvidence = new Set<number>();
  for (const keyword of keywords) {
    const tokens = words(keyword).filter(significant).map(normalize);
    const evidence = [...sentences].filter((sentence) => !usedEvidence.has(sentence.index) && tokens.every((token) => sentence.terms.has(token))).sort((a, b) => b.score - a.score)[0];
    if (!evidence) continue;
    reviewPoints.push(`${keyword}: ${evidence.text} (p. ${evidence.page})`);
    usedEvidence.add(evidence.index);
    if (reviewPoints.length >= 5) break;
  }
  return { resumo: partial + notes.join("\n\n"), pontosEstudo: reviewPoints, palavrasChave: keywords, paginas: pages.length };
}
