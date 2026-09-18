"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Loader2, Mail } from "lucide-react";

type RecoveryResponse = {
  success: boolean;
  message: string;
  data?: { emailEnviado?: boolean };
};

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") })
      });
      const result = await response.json() as RecoveryResponse;
      if (!response.ok) {
        setMessage(result.message);
        return;
      }
      setSubmitted(true);
      setMessage(result.message);
    } catch {
      setMessage("Não foi possível solicitar a recuperação agora. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) return <div className="mt-7 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800"><Check className="h-6 w-6" /></span><h2 className="mt-4 text-xl font-semibold text-stone-950">Confira seu e-mail</h2><p className="mt-2 text-sm leading-6 text-stone-600">{message}</p><p className="mt-3 text-xs leading-5 text-stone-500">O link expira em 1 hora. Verifique também as abas Promoções, Atualizações ou Spam.</p><Link href="/entrar" className="btn-secondary mt-6 w-full">Voltar para entrar</Link></div>;

  return <form onSubmit={submit} className="mt-7 grid gap-5">{message && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{message}</p>}<label>E-mail da conta<div className="relative mt-1.5"><Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" /><input name="email" required type="email" autoComplete="email" className="pl-10" placeholder="voce@email.com" /></div></label><button disabled={pending} className="btn-primary w-full">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enviar instruções <ArrowRight className="h-4 w-4" /></>}</button><Link href="/entrar" className="text-center text-sm font-bold text-emerald-800">Voltar para entrar</Link></form>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const senha = String(form.get("senha") ?? "");
    const confirmacao = String(form.get("confirmacao") ?? "");
    if (senha !== confirmacao) {
      setError("As senhas não coincidem.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message ?? "Não foi possível redefinir a senha.");
        return;
      }
      router.push("/entrar?senha-redefinida=1");
      router.refresh();
    } catch {
      setError("Não foi possível acessar o servidor. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  if (!token) return <div className="mt-7"><p className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">O link de recuperação está incompleto.</p><Link href="/recuperar-senha" className="btn-primary mt-4 w-full">Solicitar um novo link</Link></div>;

  return <form onSubmit={submit} className="mt-7 grid gap-4">{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}<label>Nova senha<div className="relative mt-1.5"><input name="senha" required minLength={8} maxLength={72} type={showPassword ? "text" : "password"} autoComplete="new-password" className="pr-10" placeholder="Pelo menos 8 caracteres" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 grid h-6 w-6 place-items-center text-stone-400" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label><label>Confirme a nova senha<input name="confirmacao" required minLength={8} maxLength={72} type={showPassword ? "text" : "password"} autoComplete="new-password" className="mt-1.5" placeholder="Digite novamente" /></label><p className="text-xs leading-5 text-stone-500">Ao redefinir, todas as sessões abertas da sua conta serão encerradas.</p><button disabled={pending} className="btn-primary mt-1 w-full">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Salvar nova senha <ArrowRight className="h-4 w-4" /></>}</button></form>;
}
