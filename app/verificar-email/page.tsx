import Link from "next/link";
import { MailCheck } from "lucide-react";
import { VerificationPanel } from "@/components/auth-forms";

export const metadata = { title: "Confirme seu e-mail" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; token?: string; erro?: string }> }) {
  const params = await searchParams;
  return <main className="grid min-h-[calc(100vh-73px)] place-items-center px-5 py-12"><section className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-soft sm:p-12"><span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-800"><MailCheck className="h-8 w-8" /></span><p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">Quase lá</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">Confirme seu e-mail</h1><p className="mt-4 leading-7 text-stone-600">{params.email ? <>Enviamos a confirmação para <strong>{params.email}</strong>.</> : "Use o link recebido para liberar sua conta."} No localhost, use o botão de confirmação abaixo.</p><VerificationPanel email={params.email ?? ""} token={params.token} initialError={params.erro} /><Link href="/entrar" className="mt-5 inline-block text-sm font-bold text-emerald-800">Voltar para entrar</Link></section></main>;
}
