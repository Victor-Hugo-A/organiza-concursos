export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12" aria-busy="true">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded bg-emerald-100" />
        <div className="mt-4 h-8 w-4/5 animate-pulse rounded bg-stone-100" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-stone-100" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-stone-100" />
        <p className="mt-6 text-sm font-medium text-stone-500">Carregando seu espaço…</p>
      </div>
    </main>
  );
}
