"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, BookOpenCheck, CalendarClock, ChevronDown, FileText, LayoutDashboard, LogOut, Plus, Target } from "lucide-react";
import clsx from "clsx";
import { BrandMark } from "@/components/brand-mark";

const items = [
  { href: "/app", label: "Visão geral", icon: LayoutDashboard },
  { href: "/app/planos", label: "Meus planos", icon: Target },
  { href: "/app/materiais", label: "Materiais", icon: FileText },
  { href: "/app/revisoes", label: "Revisões", icon: CalendarClock }
];

export function StudyShell({ children, user }: { children: React.ReactNode; user: { nome: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const initials = user.nome.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/entrar");
    router.refresh();
  }

  return <div className="min-h-screen bg-[#f8faf9]">
    <aside className="border-b border-stone-200 bg-white px-4 py-4 lg:fixed lg:inset-y-0 lg:w-[16.5rem] lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
      <div className="flex items-center justify-between gap-3 lg:block"><Link href="/app" className="flex items-center gap-3"><BrandMark size="sm" /><div><p className="font-bold tracking-tight text-stone-950">organiza</p><p className="text-xs text-stone-500">meu espaço</p></div></Link><Link href="/app/materiais" className="btn-primary px-3 py-2 lg:hidden"><Plus className="h-4 w-4" /> Material</Link></div>
      <nav className="mt-6 hidden gap-1 lg:grid">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", pathname === href ? "bg-emerald-50 text-emerald-900" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950")}><Icon className="h-[18px] w-[18px]" />{label}</Link>)}</nav>
      <div className="mt-8 hidden lg:block"><Link href="/app/materiais" className="btn-primary w-full"><Plus className="h-4 w-4" /> Adicionar material</Link></div>
      <div className="mt-10 hidden rounded-2xl bg-[#f0f8f3] p-4 lg:block"><BookOpenCheck className="h-5 w-5 text-emerald-800" /><p className="mt-3 text-sm font-semibold text-stone-900">Seu espaço cresce com você.</p><p className="mt-1 text-xs leading-5 text-stone-600">Organize, conecte e volte de onde parou.</p></div>
      <div className="relative mt-6 hidden lg:block"><button onClick={() => setAccountOpen((value) => !value)} className="flex w-full items-center justify-between rounded-xl border border-stone-200 p-3 text-left"><span className="flex min-w-0 items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">{initials}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-stone-900">{user.nome}</span><span className="block truncate text-xs text-stone-500">{user.email}</span></span></span><ChevronDown className="h-4 w-4 shrink-0 text-stone-400" /></button>{accountOpen && <div className="absolute bottom-full mb-2 w-full rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg"><button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Sair da conta</button></div>}</div>
    </aside>
    <div className="min-w-0 lg:pl-[16.5rem]"><header className="flex items-center justify-between border-b border-stone-200 bg-white/75 px-5 py-4 backdrop-blur lg:px-10"><div className="flex gap-4 overflow-x-auto lg:hidden">{items.map(({ href, label }) => <Link key={href} href={href} className={clsx("whitespace-nowrap text-sm font-semibold", pathname === href ? "text-emerald-800" : "text-stone-500")}>{label}</Link>)}</div><div className="hidden lg:block" /><div className="flex items-center gap-2"><button onClick={logout} className="text-sm font-semibold text-stone-500 hover:text-rose-700 lg:hidden">Sair</button><button aria-label="Notificações" className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"><Bell className="h-4 w-4" /></button></div></header><main className="px-5 py-8 lg:px-10 lg:py-10">{children}</main></div>
  </div>;
}
