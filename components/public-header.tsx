"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { BackLink } from "@/components/back-link";

export function PublicHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/app")) return null;
  return <header className="border-b border-stone-200/80 bg-[#f8faf9]/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8"><Link href="/" className="flex min-w-0 items-center gap-3"><BrandMark size="sm" /><div><p className="font-bold tracking-tight text-stone-950">organiza</p><p className="text-xs text-stone-500">seu espaço de estudos</p></div></Link><nav className="flex items-center gap-2 sm:gap-4"><Link href="/entrar" className="px-2 py-2 text-sm font-semibold text-stone-700 hover:text-emerald-900">Entrar</Link><Link href="/criar-conta" className="btn-primary px-3 sm:px-4">Criar conta <ArrowRight className="h-4 w-4" /></Link></nav></div>{pathname !== "/" && pathname !== "/recuperar-senha" && <div className="mx-auto max-w-7xl px-5 lg:px-8"><BackLink href={pathname === "/entrar" ? "/" : "/entrar"}>{pathname === "/entrar" ? "Voltar ao início" : "Voltar para entrar"}</BackLink></div>}</header>;
}
