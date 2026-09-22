"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Target,
} from "lucide-react";
import clsx from "clsx";
import { BrandMark } from "@/components/brand-mark";
import { BackLink } from "@/components/back-link";
import { useToast } from "@/components/toast-provider";

const items = [
  { href: "/app", label: "Visão geral", icon: LayoutDashboard },
  { href: "/app/planos", label: "Meus planos", icon: Target },
  { href: "/app/materiais", label: "Matérias", icon: FileText },
  { href: "/app/revisoes", label: "Revisões", icon: CalendarClock },
];

const titles: Record<string, string> = {
  "/app": "Visão geral",
  "/app/planos": "Meus planos",
  "/app/materiais": "Matérias",
  "/app/revisoes": "Revisões",
};

type Notifications = {
  pendingCount: number;
  dueToday: number;
  nextReview: { titulo: string; agendadaPara: string } | null;
};

export function StudyShell({
  children,
  user,
  notifications,
}: {
  children: React.ReactNode;
  user: { nome: string; email: string };
  notifications: Notifications;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { notify } = useToast();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const initials = user.nome
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const pageTitle = titles[pathname] ?? "Organiza";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    notify("warning", "Você saiu da sua conta com segurança.");
    router.push("/entrar");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f6f8f6]">
      <aside className={clsx("border-b border-stone-200 bg-white transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:border-b-0 lg:border-r", sidebarExpanded ? "lg:w-[17rem]" : "lg:w-28")}>
        <div className={clsx("flex h-full flex-col px-4 py-4 lg:py-6", sidebarExpanded ? "lg:px-5" : "lg:px-4")}>
          <div className={clsx("flex items-center justify-between gap-3", !sidebarExpanded && "lg:gap-2")}>
            <Link href="/app" className={clsx("flex min-w-0 items-center gap-3", !sidebarExpanded && "lg:shrink-0 lg:justify-center") }>
              <BrandMark size="sm" />
              <div className={clsx(!sidebarExpanded && "lg:hidden")}>
                <p className="font-bold tracking-tight text-stone-950">Organiza</p>
                <p className="text-xs text-stone-500">meu espaço de estudos</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarExpanded((value) => !value)}
              aria-label={sidebarExpanded ? "Recolher menu lateral" : "Abrir menu lateral"}
              title={sidebarExpanded ? "Recolher menu lateral" : "Abrir menu lateral"}
              className={clsx("hidden h-9 w-9 shrink-0 place-items-center rounded-lg border transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 lg:grid", sidebarExpanded ? "border-stone-200 bg-white text-stone-600" : "border-emerald-300 bg-emerald-50 text-emerald-800")}
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <Link href="/app/materiais" className="btn-primary px-3 py-2 lg:hidden">
              <Plus className="h-4 w-4" /> Material
            </Link>
          </div>

          <nav className="mt-6 hidden gap-1 lg:grid" aria-label="Navegação principal">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                    !sidebarExpanded && "justify-center px-2",
                    active
                      ? "bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-100"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className={clsx(!sidebarExpanded && "lg:hidden")}>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-7 hidden lg:block">
            <Link href="/app/materiais" title="Adicionar material" className={clsx("btn-primary w-full", !sidebarExpanded && "px-2") }>
              <Plus className="h-4 w-4" />
              <span className={clsx(!sidebarExpanded && "lg:hidden")}>Adicionar material</span>
            </Link>
          </div>

          <div className={clsx("mt-8 hidden rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 lg:block", !sidebarExpanded && "lg:hidden")}>
            <BookOpenCheck className="h-5 w-5 text-emerald-800" />
            <p className="mt-3 text-sm font-semibold text-stone-900">Estudo com direção.</p>
            <p className="mt-1 text-xs leading-5 text-stone-600">
              Organize seus materiais e acompanhe os retornos de revisão.
            </p>
          </div>

          <div className="relative mt-auto hidden lg:block">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
              className={clsx("flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white p-3 text-left transition hover:border-stone-300", !sidebarExpanded && "justify-center p-2")}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">{initials}</span>
                <span className={clsx("min-w-0", !sidebarExpanded && "lg:hidden")}>
                  <span className="block truncate text-sm font-semibold text-stone-900">{user.nome}</span>
                  <span className="block truncate text-xs text-stone-500">{user.email}</span>
                </span>
              </span>
              <ChevronDown className={clsx("h-4 w-4 shrink-0 text-stone-400", !sidebarExpanded && "lg:hidden")} />
            </button>
            {accountOpen && (
              <div className={clsx("absolute z-30 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg", sidebarExpanded ? "bottom-full mb-2 w-full" : "bottom-0 left-full ml-3 w-52")}>
                <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                  <LogOut className="h-4 w-4" /> Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={clsx("flex min-h-screen min-w-0 flex-col transition-[padding] duration-200", sidebarExpanded ? "lg:pl-[17rem]" : "lg:pl-28")}>
        <header className="sticky top-0 z-20 border-b border-stone-200/90 bg-white/90 px-5 py-3 backdrop-blur lg:px-10">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="hidden lg:block">
                <div className="text-xs font-medium text-stone-500">Área de estudos</div>
                <p className="truncate text-base font-semibold text-stone-950">{pageTitle}</p>
              </div>
              <nav className="flex gap-4 overflow-x-auto lg:hidden" aria-label="Navegação principal">
                {items.map(({ href, label }) => (
                  <Link key={href} href={href} className={clsx("whitespace-nowrap py-1 text-sm font-semibold", pathname === href ? "text-emerald-800" : "text-stone-500")}>
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={logout} className="text-sm font-semibold text-stone-500 hover:text-rose-700 lg:hidden">Sair</button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((value) => !value)}
                  aria-label="Abrir notificações de revisão"
                  aria-expanded={notificationsOpen}
                  className="relative grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {notifications.dueToday > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  {notifications.dueToday > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{notifications.dueToday > 9 ? "9+" : notifications.dueToday}</span>}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-stone-950">Lembretes de revisão</p>
                      {notifications.dueToday > 0 && <span className="badge">{notifications.dueToday} hoje</span>}
                    </div>
                    {notifications.nextReview ? (
                      <div className="mt-3 rounded-xl bg-stone-50 p-3">
                        <p className="text-xs font-medium text-stone-500">Próximo retorno</p>
                        <p className="mt-1 text-sm font-semibold text-stone-900">{notifications.nextReview.titulo}</p>
                        <p className="mt-1 text-xs text-stone-500">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(notifications.nextReview.agendadaPara))}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-stone-600">Sua agenda está livre. Novos resumos criarão lembretes automaticamente.</p>
                    )}
                    <Link href="/app/revisoes" onClick={() => setNotificationsOpen(false)} className="btn-secondary mt-4 w-full text-sm">Abrir agenda{notifications.pendingCount > 0 ? ` (${notifications.pendingCount})` : ""}</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-10 lg:py-7">
          {pathname !== "/app" && pathname !== "/app/materiais" && (
            <div className="mx-auto mb-5 max-w-6xl">
              <BackLink href="/app">Voltar à visão geral</BackLink>
            </div>
          )}
          {children}
        </main>

        <footer className="border-t border-stone-200 bg-white px-5 py-3 lg:px-10">
          <div className="flex w-full flex-col justify-between gap-2 text-xs text-stone-500 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Organiza · seu espaço de estudos.</p>
            <div className="flex items-center gap-3">
              <Link href="/app/revisoes" className="font-semibold text-emerald-800 hover:text-emerald-950">Agenda de revisões</Link>
              <Link href="/app/materiais" className="font-semibold text-emerald-800 hover:text-emerald-950">Materiais</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
