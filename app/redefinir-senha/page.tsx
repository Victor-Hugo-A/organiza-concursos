import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ResetPasswordForm } from "@/components/password-recovery-forms";

export const metadata = { title: "Criar nova senha" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className="relative grid min-h-[calc(100vh-73px)] place-items-center overflow-hidden px-5 py-12"><div className="absolute -left-20 bottom-12 -z-10 h-80 w-80 rounded-full bg-amber-100/70 blur-3xl" /><section className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_25px_80px_rgba(43,61,49,0.12)] sm:p-10"><Link href="/" className="flex items-center gap-3"><BrandMark size="sm" /><span className="font-bold text-stone-950">organiza</span></Link><span className="mt-9 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800"><LockKeyhole className="h-5 w-5" /></span><p className="mt-5 text-sm font-semibold text-emerald-800">Proteja sua conta</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-stone-950">Crie uma nova senha</h1><p className="mt-3 text-sm leading-6 text-stone-600">Escolha uma senha diferente da anterior e que você não utilize em outros serviços.</p><ResetPasswordForm token={token} /></section></main>;
}
