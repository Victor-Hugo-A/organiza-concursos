"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

export function AppFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/app")) return null;

  if (["/entrar", "/criar-conta", "/recuperar-senha", "/redefinir-senha"].includes(pathname)) {
    return (
      <footer className="border-t border-stone-200 bg-white px-5 py-3 text-xs text-stone-500">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Organiza</p>
          <p className="hidden sm:block">Seu espaço de estudos</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-stone-200 bg-white px-5 py-10 text-sm text-stone-600">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark size="sm" />
            <div>
              <p className="font-bold text-stone-950">Organiza</p>
              <p className="text-xs text-stone-500">Seu espaço de estudos</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm leading-6">Envie PDFs, transforme-os em resumos e retome os pontos certos na hora da revisão.</p>
          <p className="mt-3 text-xs text-stone-500">© {new Date().getFullYear()} Organiza. Feito para o seu ritmo.</p>
        </div>
        <nav className="grid content-start gap-2">
          <h2 className="text-sm font-bold text-stone-950">Produto</h2>
          <Link href="/" className="hover:text-emerald-800">Como funciona</Link>
          <Link href="/criar-conta" className="hover:text-emerald-800">Criar conta</Link>
          <Link href="/entrar" className="hover:text-emerald-800">Entrar</Link>
        </nav>
        <div>
          <h2 className="text-sm font-bold text-stone-950">Privacidade</h2>
          <p className="mt-2 max-w-xs leading-6">Seus materiais são seus. O Organiza foi pensado para dar visibilidade ao seu estudo, sem ruído.</p>
        </div>
      </div>
    </footer>
  );
}
