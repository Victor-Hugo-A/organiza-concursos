import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><ArrowLeft aria-hidden="true" className="h-4 w-4" />{children}</Link>;
}
