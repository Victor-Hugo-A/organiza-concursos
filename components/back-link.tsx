import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return <Link href={href} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${className}`}><ArrowLeft aria-hidden="true" className="h-4 w-4" />{children}</Link>;
}
