import Link from "next/link";
import { ArrowRight, BookOpen, Check, FileText, FolderKanban, Sparkles, Tags } from "lucide-react";

const steps = [
  { icon: FolderKanban, title: "Crie seu objetivo", text: "ENEM, PAS, concurso ou qualquer prova. Cada meta ganha seu próprio espaço." },
  { icon: FileText, title: "Guarde seus materiais", text: "Envie slides e PDFs para deixar tudo que importa no mesmo lugar." },
  { icon: Tags, title: "Encontre o essencial", text: "Marque palavras-chave e transforme páginas extensas em trilhas objetivas." }
];

export default function HomePage() {
  return <main className="overflow-hidden">
    <section className="relative px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="absolute -right-24 top-0 -z-10 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> estudo com intenção</div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-stone-950 sm:text-6xl lg:text-7xl">Seu material merece virar <span className="text-emerald-800">clareza.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">Organize PDFs, slides, temas e revisões em um espaço feito para estudar com foco — do ENEM aos concursos públicos.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/criar-conta" className="btn-primary px-5 py-3">Começar gratuitamente <ArrowRight className="h-4 w-4" /></Link><a href="#como-funciona" className="btn-secondary px-5 py-3">Entender como funciona</a></div>
          <p className="mt-5 flex items-center gap-2 text-sm text-stone-500"><Check className="h-4 w-4 text-emerald-700" /> Comece com um plano, um material e uma ideia clara.</p>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-5 -z-10 rotate-3 rounded-[2.5rem] bg-emerald-200/45" />
          <div className="rounded-[2rem] border border-stone-200 bg-[#fffefa] p-4 shadow-[0_30px_80px_rgba(45,64,52,0.18)] sm:p-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /></div><span className="text-xs font-medium text-stone-400">Meu espaço</span></div>
            <div className="mt-6 flex items-center justify-between"><div><p className="text-sm text-stone-500">Seu espaço pessoal</p><h2 className="text-2xl font-semibold tracking-tight text-stone-950">Seu estudo de hoje</h2></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-800 text-white"><BookOpen className="h-5 w-5" /></div></div>
            <div className="mt-6 rounded-2xl bg-emerald-900 p-5 text-white"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Plano ativo</p><p className="mt-2 text-xl font-semibold">ENEM 2026</p></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">68%</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[68%] rounded-full bg-emerald-300" /></div><p className="mt-3 text-sm text-emerald-100">12 de 18 tópicos explorados</p></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-stone-100 bg-white p-4"><p className="text-xs font-semibold text-stone-400">PRÓXIMO MATERIAL</p><p className="mt-2 font-semibold text-stone-900">Brasil República.pdf</p><div className="mt-3 flex flex-wrap gap-1.5"><span className="badge">Era Vargas</span><span className="badge">1930</span></div></div><div className="rounded-2xl border border-stone-100 bg-[#fff8e7] p-4"><p className="text-xs font-semibold text-stone-400">REVISÃO</p><p className="mt-2 font-semibold text-stone-900">Funções orgânicas</p><p className="mt-3 text-sm text-amber-800">hoje, 19:00</p></div></div>
          </div>
        </div>
      </div>
    </section>
    <section id="como-funciona" className="border-y border-stone-200 bg-white px-5 py-20 lg:px-8"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">Um lugar para cada etapa</p><div className="mt-3 flex flex-col justify-between gap-5 md:flex-row"><h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-stone-950">Estudar fica mais leve quando tudo conversa.</h2><p className="max-w-sm leading-7 text-stone-600">O Organiza mantém seu caminho visível: onde você está, o que falta e por onde retomar.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{steps.map(({ icon: Icon, title, text }, index) => <article key={title} className="rounded-3xl border border-stone-200 bg-[#fdfdfb] p-6"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-900"><Icon className="h-5 w-5" /></span><p className="mt-8 text-xs font-bold tracking-widest text-stone-400">0{index + 1}</p><h3 className="mt-2 text-xl font-semibold text-stone-950">{title}</h3><p className="mt-3 leading-7 text-stone-600">{text}</p></article>)}</div></div></section>
  </main>;
}
