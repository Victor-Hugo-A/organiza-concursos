import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  CalendarCheck2,
  Check,
  FileSearch,
  FolderKanban,
  Sparkles,
  Upload,
} from "lucide-react";

const steps = [
  {
    icon: FolderKanban,
    number: "01",
    title: "Organize por objetivo e matéria",
    text: "Crie um plano para ENEM, PAS ou concurso. Dentro dele, separe História, Matemática, Direito ou qualquer outra matéria.",
  },
  {
    icon: FileSearch,
    number: "02",
    title: "Envie o PDF e encontre o que importa",
    text: "Ao adicionar uma apostila ou slide, o material ganha um resumo, pontos de revisão e palavras-chave para você consultar depois.",
  },
  {
    icon: CalendarCheck2,
    number: "03",
    title: "Retome no momento certo",
    text: "A agenda cria os retornos do material e distribui o estudo em até dois materiais por dia para manter uma rotina possível.",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section id="topo" className="relative isolate px-5 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="absolute -left-40 top-20 -z-10 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="absolute -right-32 top-0 -z-10 h-[30rem] w-[30rem] rounded-full bg-amber-100/70 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              do PDF à revisão
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-stone-950 sm:text-6xl lg:text-7xl">
              Transforme cada PDF em <span className="home-word-rotator" aria-label="um resumo claro, palavras-chave, pontos de revisão e uma rotina possível"><span aria-hidden="true">um resumo claro</span><span aria-hidden="true">palavras-chave</span><span aria-hidden="true">pontos de revisão</span><span aria-hidden="true">uma rotina possível</span></span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
              O Organiza reúne seus slides e apostilas por matéria, prepara um resumo com os pontos centrais e coloca as revisões na agenda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/criar-conta" className="btn-primary px-5 py-3">
                Criar meu espaço de estudo <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#como-funciona" className="btn-secondary px-5 py-3">
                Ver as etapas
              </a>
            </div>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ["Planos", "ENEM, PAS e concursos"],
                ["Materiais", "PDFs e slides por matéria"],
                ["Revisões", "até 2 materiais por dia"],
              ].map(([label, text]) => (
                <div key={label} className="rounded-xl border border-white/80 bg-white/70 p-3 shadow-sm backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-stone-600">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl py-5 sm:py-8" aria-label="Exemplo do fluxo de estudo na plataforma">
            <div className="absolute inset-4 -z-10 rotate-3 rounded-[2.5rem] bg-emerald-200/45" />
            <div className="absolute inset-8 -z-10 -rotate-3 rounded-[2.5rem] border border-amber-200/70 bg-amber-50/60" />
            <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-[#fffefa] p-4 shadow-[0_30px_80px_rgba(45,64,52,0.18)] sm:p-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
                <span className="text-xs font-semibold text-stone-400">Fluxo de estudo</span>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-emerald-800">Plano ENEM 2026</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-stone-950">História do Brasil</h2>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-white">
                  <FolderKanban className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                <article className="home-float-one relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <span className="home-scan pointer-events-none absolute inset-x-0 top-0 h-px bg-emerald-400" />
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700">
                      <Upload className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-stone-900">Brasil República — aula 01.pdf</p>
                        <span className="text-xs font-semibold text-emerald-800">Adicionado</span>
                      </div>
                      <p className="mt-1 text-sm text-stone-500">História · 42 páginas</p>
                    </div>
                  </div>
                </article>

                <article className="home-float-two rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-800 shadow-sm">
                      <FileSearch className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900">Resumo e palavras-chave prontos</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="badge">Era Vargas</span>
                        <span className="badge">Revolução de 1930</span>
                        <span className="badge">Estado Novo</span>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="home-float-three rounded-2xl border border-amber-200 bg-[#fff8e7] p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-800 shadow-sm">
                      <CalendarCheck2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900">1ª revisão agendada</p>
                      <p className="mt-1 text-sm text-stone-600">Amanhã, às 9h · rotina com até dois materiais no dia</p>
                    </div>
                    <Check className="h-5 w-5 shrink-0 text-emerald-700" />
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-stone-200 bg-white px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">Como o Organiza trabalha com seu material</p>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-stone-950">
              Cada etapa deixa claro o próximo passo do seu estudo.
            </h2>
            <p className="max-w-sm leading-7 text-stone-600">
              Você não precisa escolher entre arquivos espalhados, anotações soltas e uma agenda impossível de cumprir.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, number, title, text }) => (
              <article key={title} className="rounded-3xl border border-stone-200 bg-[#fdfdfb] p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-900">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-bold tracking-widest text-stone-400">{number}</p>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-stone-950">{title}</h3>
                <p className="mt-3 leading-7 text-stone-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef6f0] px-5 py-14 lg:px-8 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm sm:flex-row sm:items-center sm:p-9">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Seu acervo de estudo em ordem</p>
            <h2 className="mt-1 max-w-2xl text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
              Comece com uma matéria e um PDF. O restante do caminho fica visível.
            </h2>
          </div>
          <a href="#topo" className="btn-secondary shrink-0 px-5 py-3">
            Voltar ao início <ArrowUp className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
