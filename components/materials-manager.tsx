"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FolderUp, Loader2, Search, Tags, X } from "lucide-react";

type Plan = { id: string; titulo: string };
type Material = { id: string; titulo: string; nomeArquivo: string; urlArquivo: string; plano: Plan | null; palavrasChave: Array<{ id: string; termo: string }>; atualizadoEm: string };

export function MaterialsManager({ plans, initialMaterials }: { plans: Plan[]; initialMaterials: Material[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagValue, setTagValue] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const addTag = () => {
    const tag = tagValue.trim();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagValue("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(); }
  };
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    if (selected && !title) setTitle(selected.name.replace(/\.pdf$/i, ""));
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setPending(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    data.set("arquivo", file);
    data.set("titulo", title);
    data.set("tags", tags.join(","));
    const response = await fetch("/api/materials", { method: "POST", body: data });
    const result = await response.json();
    setPending(false);
    if (!response.ok) {
      setMessage(result.message ?? "Não foi possível salvar o material.");
      return;
    }
    setMessage("Material salvo no seu acervo.");
    setFile(null);
    setTitle("");
    setTags([]);
    formRef.current?.reset();
    router.refresh();
  }
  const materials = initialMaterials.filter((material) => material.titulo.toLowerCase().includes(search.toLowerCase()));

  return <div className="mx-auto max-w-6xl"><div><p className="text-sm font-semibold text-emerald-800">Seu acervo</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">Materiais de estudo</h1><p className="mt-2 max-w-2xl text-stone-600">Envie seus slides em PDF e escolha os termos que ajudam a reencontrar o que importa.</p></div>
    <form ref={formRef} onSubmit={submit} className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]"><div className="rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/50 p-6 sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-800 shadow-sm"><FolderUp className="h-5 w-5" /></span><h2 className="mt-5 text-xl font-semibold text-stone-950">Adicionar um material</h2><p className="mt-2 text-sm leading-6 text-stone-600">No localhost, o arquivo fica em public/uploads. Na Vercel, configure o Blob Storage.</p><label className="mt-6 block"><span className="sr-only">Escolher arquivo</span><input name="arquivo" required type="file" accept=".pdf,application/pdf" onChange={onFile} /></label>{file ? <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-900"><FileText className="h-4 w-4" /> {file.name}</p> : <p className="mt-3 text-xs text-stone-500">PDF de até 4 MB.</p>}</div>
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"><div className="flex items-center gap-2"><Tags className="h-5 w-5 text-emerald-800" /><h2 className="text-xl font-semibold text-stone-950">Palavras-chave</h2></div><p className="mt-2 text-sm leading-6 text-stone-600">Use Enter ou vírgula para cada termo.</p><div className="mt-5 flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-stone-200 p-2 focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-100">{tags.map((tag) => <button key={tag} type="button" onClick={() => setTags(tags.filter((item) => item !== tag))} className="badge inline-flex items-center gap-1">{tag}<X className="h-3 w-3" /></button>)}<input value={tagValue} onChange={(event) => setTagValue(event.target.value)} onKeyDown={onKeyDown} onBlur={addTag} className="min-w-32 flex-1 border-0 p-1.5 shadow-none focus:ring-0" placeholder="Ex.: Era Vargas" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label>Plano<select name="planoId" className="mt-1.5"><option value="">Sem plano</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.titulo}</option>)}</select></label><label>Título<input name="titulo" required className="mt-1.5" placeholder="Nome do material" value={title} onChange={(event) => setTitle(event.target.value)} /></label></div>{message && <p className="mt-4 text-sm font-semibold text-emerald-800">{message}</p>}<button disabled={!file || pending} className="btn-primary mt-6 w-full">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar no meu acervo</button></div></form>
    <section className="mt-12"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-stone-400">Já organizados</p><h2 className="mt-1 text-2xl font-semibold text-stone-950">Materiais recentes</h2></div><label className="relative w-full sm:w-64"><span className="sr-only">Buscar materiais</span><Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" placeholder="Buscar no acervo" /></label></div>{materials.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">Nenhum material encontrado.</div> : <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">{materials.map((material) => <a href={material.urlArquivo} target="_blank" rel="noreferrer" key={material.id} className="flex items-center gap-4 border-b border-stone-100 p-4 last:border-0 hover:bg-stone-50"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700"><FileText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold text-stone-900">{material.titulo}</h3><p className="mt-0.5 text-sm text-stone-500">{material.plano?.titulo ?? "Sem plano"} · {new Intl.DateTimeFormat("pt-BR").format(new Date(material.atualizadoEm))}</p><div className="mt-2 flex flex-wrap gap-1.5">{material.palavrasChave.map((tag) => <span key={tag.id} className="badge">{tag.termo}</span>)}</div></div></a>)}</div>}</section>
  </div>;
}
