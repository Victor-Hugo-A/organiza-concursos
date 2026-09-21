import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ForgotPasswordForm } from "@/components/password-recovery-forms";

export const metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return <main className="relative grid min-h-0 flex-1 place-items-center overflow-hidden px-5 py-5"><div className="absolute -right-20 top-12 -z-10 h-80 w-80 rounded-full bg-emerald-100 blur-3xl" /><section className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(43,61,49,0.11)] sm:p-8"><Link href="/" className="flex items-center gap-3"><BrandMark size="sm" /><span className="font-bold text-stone-950">Organiza</span></Link><span className="mt-6 grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-800"><KeyRound className="h-5 w-5" /></span><p className="mt-4 text-sm font-semibold text-emerald-800">Acesso à sua conta</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-stone-950">Recupere sua senha</h1><p className="mt-2 text-sm leading-6 text-stone-600">Informe o e-mail usado no cadastro. Enviaremos um link seguro para você criar uma nova senha.</p><ForgotPasswordForm /><p className="mt-5 flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs leading-5 text-stone-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> Por segurança, não informamos se um e-mail está ou não cadastrado.</p></section></main>;
}
