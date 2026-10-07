"use client";

import { FormEvent, useState } from "react";
import { BookText, Link2, Loader2, NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { StudyTopic } from "@/components/topic-manager";

type LibraryMaterialType = "TEXTO" | "ANOTACAO" | "LINK";

const types: {
  value: LibraryMaterialType;
  label: string;
  description: string;
  Icon: typeof BookText;
}[] = [
  { value: "TEXTO", label: "Texto", description: "Um conteúdo próprio para consultar depois.", Icon: BookText },
  { value: "ANOTACAO", label: "Anotação", description: "Uma observação ou resumo escrito por você.", Icon: NotebookPen },
  { value: "LINK", label: "Link", description: "Uma aula, artigo ou referência externa.", Icon: Link2 },
];

export function LibraryMaterialCreator({
  materiaId,
  topics,
}: {
  materiaId: string;
  topics: StudyTopic[];
}) {
  const router = useRouter();
  const [type, setType] = useState<LibraryMaterialType>("TEXTO");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/materials/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materiaId,
        topicoId: form.get("topicoId") || null,
        titulo: form.get("titulo"),
        tipo: type,
        conteudo: form.get("conteudo"),
        urlExterna: form.get("urlExterna"),
      }),
    }).catch(() => null);

    const result = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(result?.message ?? "Não foi possível adicionar o material.");
      setPending(false);
      return;
    }

    event.currentTarget.reset();
    setPending(false);
    router.refresh();
  }

  const selected = types.find((item) => item.value === type) ?? types[0];
  const SelectedIcon = selected.Icon;

  return (
    <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-emerald-50 p-3 text-emerald-800"><SelectedIcon className="h-5 w-5" /></span>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Além do PDF</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-950">Adicionar à biblioteca</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{selected.description}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Tipo de material">
        {types.map((item) => {
          const Icon = item.Icon;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={type === item.value}
              onClick={() => setType(item.value)}
              className={type === item.value ? "btn-primary text-sm" : "btn-secondary text-sm"}
            >
              <Icon className="h-4 w-4" /> {item.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-4">
        <label>
          Título
          <input name="titulo" required minLength={2} maxLength={150} className="mt-1.5" placeholder={type === "LINK" ? "Ex.: Aula sobre cinemática" : "Ex.: Resumo da aula 2"} />
        </label>
        <label>
          Tópico relacionado <span className="font-normal text-stone-500">(opcional)</span>
          <select name="topicoId" defaultValue="" className="mt-1.5">
            <option value="">Sem tópico</option>
            {topics.map((topic) => {
              const parent = topics.find((candidate) => candidate.id === topic.topicoPaiId);
              return <option key={topic.id} value={topic.id}>{parent ? `${parent.titulo} › ${topic.titulo}` : topic.titulo}</option>;
            })}
          </select>
        </label>
        {type === "LINK" ? (
          <label>
            Endereço do link
            <input name="urlExterna" type="url" required maxLength={2048} className="mt-1.5" placeholder="https://..." />
          </label>
        ) : (
          <label>
            Conteúdo
            <textarea name="conteudo" required maxLength={20000} rows={6} className="mt-1.5" placeholder={type === "ANOTACAO" ? "Escreva suas observações, dúvidas ou pontos importantes..." : "Cole ou escreva o texto que deseja guardar..."} />
          </label>
        )}
        {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
        <button disabled={pending} className="btn-primary w-full sm:w-fit">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar {selected.label.toLowerCase()}
        </button>
      </form>
    </section>
  );
}
