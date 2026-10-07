"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-7 text-center shadow-sm">
        <p className="text-sm font-semibold text-rose-700">Não foi possível carregar esta página</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
          Tente novamente em instantes.
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Seus dados não foram alterados. Se o problema continuar, volte ao início e tente acessar novamente.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            Tentar novamente
          </button>
          <Link href="/" className="btn-secondary">
            Ir para o início
          </Link>
        </div>
      </section>
    </main>
  );
}
