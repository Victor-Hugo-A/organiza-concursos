"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, ClipboardCheck, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type Topic = { id: string; titulo: string; topicoPaiId: string | null };
type Subject = { id: string; titulo: string; topicos: Topic[] };
type Plan = { id: string; titulo: string; materias: Subject[] };
type Question = {
  id: string;
  enunciado: string;
  alternativas: string[];
  dificuldade: "FACIL" | "MEDIO" | "DIFICIL";
  materia: { titulo: string };
  topico: { titulo: string } | null;
  tentativas: { correta: boolean; respondidaEm: string }[];
  _count: { tentativas: number };
};
type AnswerResult = { correta: boolean; respostaCorreta: string; explicacao: string | null };

const labels = ["A", "B", "C", "D"];

function difficultyLabel(value: Question["dificuldade"]) {
  return { FACIL: "Fácil", MEDIO: "Médio", DIFICIL: "Difícil" }[value];
}

async function requestJson(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => null);
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(result?.message ?? "Não foi possível concluir esta ação.");
  return result;
}

export function PracticeManager({
  plans,
  questions,
  stats,
}: {
  plans: Plan[];
  questions: Question[];
  stats: { attempts: number; correct: number };
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? "");
  const [selectedSubjectId, setSelectedSubjectId] = useState(plans[0]?.materias[0]?.id ?? "");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const [pending, setPending] = useState("");
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
  const subjects = selectedPlan?.materias ?? [];
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0];
  const accuracy = stats.attempts ? Math.round((stats.correct / stats.attempts) * 100) : null;
  const availableTopics = useMemo(() => selectedSubject?.topicos ?? [], [selectedSubject]);

  function choosePlan(planId: string) {
    setSelectedPlanId(planId);
    setSelectedSubjectId(plans.find((plan) => plan.id === planId)?.materias[0]?.id ?? "");
  }

  async function createQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const alternatives = labels.map((label) => String(form.get(`alternativa-${label}`) ?? "").trim());
    const correctIndex = Number(form.get("respostaCorreta"));
    setPending("create");
    try {
      const result = await requestJson("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiaId: form.get("materiaId"),
          topicoId: form.get("topicoId") || null,
          enunciado: form.get("enunciado"),
          alternativas: alternatives,
          respostaCorreta: alternatives[correctIndex],
          explicacao: form.get("explicacao"),
          dificuldade: form.get("dificuldade"),
        }),
      });
      formElement.reset();
      setCreatorOpen(false);
      notify("success", result.message ?? "Questão adicionada à sua prática.");
      router.refresh();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Não foi possível criar a questão.");
    } finally {
      setPending("");
    }
  }

  async function answer(question: Question) {
    const choice = selectedAnswers[question.id];
    if (!choice) {
      notify("warning", "Escolha uma alternativa antes de responder.");
      return;
    }
    setPending(question.id);
    try {
      const result = await requestJson(`/api/questions/${question.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostaEscolhida: choice }),
      });
      const feedback = result.data as AnswerResult;
      setResults((current) => ({ ...current, [question.id]: feedback }));
      notify(feedback.correta ? "success" : "warning", feedback.correta ? "Resposta correta." : "Resposta incorreta. Confira a explicação.");
      router.refresh();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Não foi possível registrar a resposta.");
    } finally {
      setPending("");
    }
  }

  async function removeQuestion(question: Question) {
    if (!window.confirm(`Excluir esta questão? As ${question._count.tentativas} tentativa(s) registradas também serão removidas.`)) return;
    setPending(question.id);
    try {
      await requestJson(`/api/questions/${question.id}`, { method: "DELETE" });
      notify("destructive", "Questão excluída. As tentativas vinculadas foram removidas.");
      router.refresh();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Não foi possível excluir a questão.");
    } finally {
      setPending("");
    }
  }

  function alternativeStateClass(questionId: string, alternative: string, result?: AnswerResult) {
    const selected = selectedAnswers[questionId] === alternative;

    if (result && selected && !result.correta) {
      return "border-rose-400 bg-rose-50";
    }

    if (result && result.respostaCorreta === alternative) {
      return "border-emerald-500 bg-emerald-50/60";
    }

    if (selected) {
      return "border-emerald-500 bg-emerald-50/60";
    }

    return "border-stone-200 hover:border-stone-300";
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-emerald-800">Prática consciente</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Questões</h1><p className="mt-2 max-w-2xl text-stone-600">Cadastre questões próprias, responda quantas vezes precisar e acompanhe seus acertos reais.</p></div>
        <button type="button" onClick={() => setCreatorOpen((value) => !value)} className="btn-primary"><Plus className="h-4 w-4" /> Nova questão</button>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm font-medium text-stone-500">Questões cadastradas</p><p className="mt-2 text-3xl font-semibold text-stone-950">{questions.length}</p></div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm font-medium text-stone-500">Tentativas registradas</p><p className="mt-2 text-3xl font-semibold text-stone-950">{stats.attempts}</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5"><p className="text-sm font-medium text-emerald-800">Aproveitamento</p><p className="mt-2 text-3xl font-semibold text-emerald-950">{accuracy === null ? "—" : `${accuracy}%`}</p><p className="mt-1 text-xs text-emerald-800">{stats.attempts ? `${stats.correct} acertos em ${stats.attempts} tentativas` : "Responda uma questão para calcular."}</p></div>
      </section>

      {creatorOpen && (
        <section className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-7">
          <h2 className="text-xl font-semibold text-stone-950">Cadastrar questão</h2>
          {!plans.some((plan) => plan.materias.length) ? <p className="mt-3 text-sm text-stone-600">Crie uma matéria antes de cadastrar questões.</p> : <form onSubmit={createQuestion} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2"><label>Plano<select value={selectedPlanId} onChange={(event) => choosePlan(event.target.value)} className="mt-1.5">{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.titulo}</option>)}</select></label><label>Matéria<select name="materiaId" value={selectedSubject?.id ?? ""} onChange={(event) => setSelectedSubjectId(event.target.value)} className="mt-1.5">{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.titulo}</option>)}</select></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label>Tópico <span className="font-normal text-stone-500">(opcional)</span><select key={selectedSubject?.id} name="topicoId" defaultValue="" className="mt-1.5"><option value="">Sem tópico</option>{availableTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.titulo}</option>)}</select></label><label>Dificuldade<select name="dificuldade" defaultValue="MEDIO" className="mt-1.5"><option value="FACIL">Fácil</option><option value="MEDIO">Médio</option><option value="DIFICIL">Difícil</option></select></label></div>
            <label>Enunciado<textarea name="enunciado" required minLength={10} maxLength={10000} rows={4} className="mt-1.5" placeholder="Escreva a pergunta da questão..." /></label>
            <fieldset><legend className="text-sm font-semibold text-stone-700">Alternativas e resposta correta</legend><div className="mt-3 grid gap-3">{labels.map((label, index) => <label key={label} className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-emerald-800">{label}</span><input name={`alternativa-${label}`} required maxLength={1000} placeholder={`Alternativa ${label}`} /><input type="radio" name="respostaCorreta" value={index} defaultChecked={index === 0} aria-label={`Marcar alternativa ${label} como correta`} /></label>)}</div></fieldset>
            <label>Explicação <span className="font-normal text-stone-500">(opcional)</span><textarea name="explicacao" maxLength={5000} rows={3} className="mt-1.5" placeholder="Explique por que a resposta correta é a melhor opção." /></label>
            <div className="flex flex-wrap gap-3"><button disabled={pending === "create"} className="btn-primary">{pending === "create" && <Loader2 className="h-4 w-4 animate-spin" />} Salvar questão</button><button type="button" onClick={() => setCreatorOpen(false)} className="btn-secondary">Cancelar</button></div>
          </form>}
        </section>
      )}

      <section className="mt-10"><div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-emerald-800" /><h2 className="text-2xl font-semibold text-stone-950">Praticar</h2></div>
        {!questions.length ? <div className="mt-5 rounded-3xl border border-dashed border-stone-300 bg-white/60 p-10 text-center"><ClipboardCheck className="mx-auto h-7 w-7 text-stone-400" /><h3 className="mt-3 font-semibold text-stone-950">Nenhuma questão cadastrada</h3><p className="mt-2 text-sm text-stone-600">Comece registrando uma questão da sua matéria para praticar aqui.</p></div> : <div className="mt-5 space-y-5">{questions.map((question) => {
          const result = results[question.id];
          return <article key={question.id} className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex flex-wrap gap-2"><span className="badge">{question.materia.titulo}</span>{question.topico && <span className="badge">{question.topico.titulo}</span>}<span className="badge">{difficultyLabel(question.dificuldade)}</span></div><button type="button" onClick={() => removeQuestion(question)} disabled={Boolean(pending)} className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-700" aria-label="Excluir questão"><Trash2 className="h-4 w-4" /></button></div><p className="mt-5 whitespace-pre-wrap text-base leading-7 text-stone-900">{question.enunciado}</p><div className="mt-5 grid gap-3">{question.alternativas.map((alternative, index) => <label key={alternative} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${alternativeStateClass(question.id, alternative, result)}`}><input type="radio" name={`question-${question.id}`} checked={selectedAnswers[question.id] === alternative} onChange={() => setSelectedAnswers((current) => ({ ...current, [question.id]: alternative }))} className="mt-1" /><span><strong className="mr-2 text-emerald-800">{labels[index]}.</strong>{alternative}</span></label>)}</div><div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => answer(question)} disabled={Boolean(pending)} className="btn-primary">{pending === question.id && <Loader2 className="h-4 w-4 animate-spin" />} Responder</button><span className="text-xs text-stone-500">{question._count.tentativas} {question._count.tentativas === 1 ? "tentativa" : "tentativas"}</span>{question.tentativas[0] && <span className="text-xs text-stone-500">Última: {question.tentativas[0].correta ? "acertou" : "errou"} em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(question.tentativas[0].respondidaEm))}</span>}</div>{result && <div className={`mt-5 rounded-2xl p-4 ${result.correta ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`}><p className="flex items-center gap-2 font-semibold">{result.correta ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}{result.correta ? "Você acertou." : `Resposta correta: ${result.respostaCorreta}`}</p>{result.explicacao && <p className="mt-2 text-sm leading-6">{result.explicacao}</p>}</div>}</article>;
        })}</div>}
      </section>
    </div>
  );
}
