"use client";

import { ChangeEvent, KeyboardEvent, useState } from "react";
import { FileText, FolderUp, MoreHorizontal, Search, Tags, X } from "lucide-react";

const savedMaterials = [
  { title: "Brasil República.pdf", plan: "ENEM 2026", date: "editado hoje", tags: ["Era Vargas", "Política"] },
  { title: "Funções orgânicas — slides.pdf", plan: "ENEM 2026", date: "editado ontem", tags: ["Química", "Carbono"] },
  { title: "Direito constitucional.pdf", plan: "Analista administrativo", date: "editado em 14 set", tags: ["CF/88", "Princípios"] }
];

export default function MaterialsPage() {
  const [fileName, setFileName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagValue, setTagValue] = useState("");
  const addTag = () => {
    const tag = tagValue.trim();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagValue("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(); }
  };
  const onFile = (event: ChangeEvent<HTMLInputElement>) => setFileName(event.target.files?.[0]?.name ?? "");

  return <div className="mx-auto max-w-6xl"><div><p className="text-sm font-semibold text-emerald-800">Seu acervo</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">Materiais de estudo</h1><p className="mt-2 max-w-2xl text-stone-600">Envie seus slides e PDFs. Ao salvar, escolha os termos que vão te ajudar a reencontrar o que importa.</p></div>
    <section className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]"><div className="rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/50 p-6 sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-800 shadow-sm"><FolderUp className="h-5 w-5" /></span><h2 className="mt-5 text-xl font-semibold tracking-tight text-stone-950">Adicionar um material</h2><p className="mt-2 max-w-md text-sm leading-6 text-stone-600">PDFs e slides entram no seu acervo, prontos para serem ligados a um plano e aos seus termos de estudo.</p><label className="mt-6 block"><span className="sr-only">Escolher arquivo</span><input type="file" accept=".pdf,application/pdf" onChange={onFile} /></label>{fileName ? <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-900"><FileText className="h-4 w-4" /> {fileName}</p> : <p className="mt-3 text-xs text-stone-500">Escolha um PDF para começar.</p>}</div>
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"><div className="flex items-center gap-2"><Tags className="h-5 w-5 text-emerald-800" /><h2 className="text-xl font-semibold tracking-tight text-stone-950">Palavras-chave</h2></div><p className="mt-2 text-sm leading-6 text-stone-600">Adicione temas, conceitos ou nomes. Use Enter ou vírgula para cada termo.</p><div className="mt-5 flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-2 focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-100">{tags.map((tag) => <button key={tag} type="button" onClick={() => setTags(tags.filter((item) => item !== tag))} className="badge inline-flex items-center gap-1 hover:bg-emerald-100">{tag}<X className="h-3 w-3" /></button>)}<input value={tagValue} onChange={(event) => setTagValue(event.target.value)} onKeyDown={onKeyDown} onBlur={addTag} className="min-w-32 flex-1 border-0 p-1.5 text-sm shadow-none focus:ring-0" placeholder={tags.length ? "Outro termo" : "Ex.: Era Vargas"} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label>Plano<select className="mt-1.5"><option>ENEM 2026</option><option>Analista administrativo</option></select></label><label>Título<input className="mt-1.5" placeholder="Nome do material" value={fileName.replace(".pdf", "")} onChange={(event) => setFileName(event.target.value)} /></label></div><button type="button" disabled={!fileName} className="btn-primary mt-6 w-full">Salvar no meu acervo</button></div></section>
    <section className="mt-12"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-stone-400">Já organizados</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">Materiais recentes</h2></div><label className="relative w-full sm:w-64"><span className="sr-only">Buscar materiais</span><Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" /><input className="pl-10" placeholder="Buscar no acervo" /></label></div><div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">{savedMaterials.map((material) => <article key={material.title} className="flex items-center gap-4 border-b border-stone-100 p-4 last:border-0"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700"><FileText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold text-stone-900">{material.title}</h3><p className="mt-0.5 text-sm text-stone-500">{material.plan} · {material.date}</p><div className="mt-2 flex flex-wrap gap-1.5">{material.tags.map((tag) => <span key={tag} className="badge">{tag}</span>)}</div></div><button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label="Mais opções"><MoreHorizontal className="h-5 w-5" /></button></article>)}</div></section>
  </div>;
}
