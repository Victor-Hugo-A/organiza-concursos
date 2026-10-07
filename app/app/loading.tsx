export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" aria-busy="true">
      <div className="h-5 w-32 animate-pulse rounded bg-emerald-100" />
      <div className="h-10 w-64 max-w-full animate-pulse rounded bg-stone-200" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-2xl border border-stone-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
