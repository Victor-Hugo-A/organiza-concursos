import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <p className="text-sm font-semibold text-[#0d766e]">Página não encontrada</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#17251f]">
          Este caminho não existe.
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Verifique o endereço ou volte para uma área conhecida da plataforma.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#17251f] px-5 text-sm font-semibold text-white transition hover:bg-[#244234]"
        >
          Ir para o início
        </Link>
      </section>
    </main>
  );
}
