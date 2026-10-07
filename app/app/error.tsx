"use client";

export default function StudyAreaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-rose-100 bg-white p-7 text-center shadow-sm">
      <p className="text-sm font-semibold text-rose-700">Não foi possível abrir seus dados de estudo</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Tente carregar a página novamente. Seus materiais e planos permanecem salvos.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-5">
        Tentar novamente
      </button>
    </section>
  );
}
