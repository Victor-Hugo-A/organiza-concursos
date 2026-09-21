"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";

type ApiResult = {
  success: boolean;
  message: string;
  data?: { email?: string; emailEnviado?: boolean };
};

export function LoginForm({ verified = false, passwordReset = false }: { verified?: boolean; passwordReset?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: form.get("senha"), lembrar: form.get("lembrar") === "on" })
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) {
        setError(result.message);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("Não foi possível acessar o servidor. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return <form className="mt-5 grid gap-3" onSubmit={submit}>
    {verified && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">E-mail confirmado. Agora você já pode entrar.</p>}
    {passwordReset && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Senha atualizada. Entre com sua nova senha.</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
    <label>E-mail<div className="relative mt-1.5"><Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" /><input name="email" required className="pl-10" type="email" placeholder="voce@email.com" autoComplete="email" /></div></label>
    <label>Senha<div className="relative mt-1.5"><LockKeyhole className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" /><input name="senha" required className="pl-10 pr-10" type={showPassword ? "text" : "password"} placeholder="Sua senha" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 grid h-6 w-6 place-items-center text-stone-400" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
    <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs font-medium text-stone-600"><input name="lembrar" type="checkbox" className="h-4 w-4 rounded border-stone-300 p-0 text-emerald-800 focus:ring-emerald-200" /> Manter conectado</label><Link href="/recuperar-senha" className="text-xs font-bold text-emerald-800 hover:text-emerald-950">Esqueci minha senha</Link></div>
    <button disabled={pending} className="btn-primary mt-2 w-full">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar no meu espaço <ArrowRight className="h-4 w-4" /></>}</button>
  </form>;
}

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: form.get("nome"), email: form.get("email"), senha: form.get("senha") })
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) {
        setError(result.message);
        return;
      }
      const params = new URLSearchParams({ email: result.data?.email ?? String(form.get("email")) });
      router.push(`/verificar-email?${params.toString()}`);
    } catch {
      setError("Não foi possível criar sua conta. Verifique a conexão com o banco.");
    } finally {
      setPending(false);
    }
  }

  return <form className="mt-7 grid gap-4" onSubmit={submit}>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
    <label>Como podemos te chamar?<div className="relative mt-1.5"><UserRound className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" /><input name="nome" required minLength={2} className="pl-10" placeholder="Seu nome" autoComplete="name" /></div></label>
    <label>Seu e-mail<div className="relative mt-1.5"><Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" /><input name="email" required className="pl-10" type="email" placeholder="voce@email.com" autoComplete="email" /></div></label>
    <label>Crie uma senha<div className="relative mt-1.5"><LockKeyhole className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" /><input name="senha" required minLength={8} maxLength={72} className="pl-10" type="password" placeholder="Pelo menos 8 caracteres" autoComplete="new-password" /></div></label>
    <button disabled={pending} className="btn-primary mt-1 w-full">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar meu espaço <ArrowRight className="h-4 w-4" /></>}</button>
  </form>;
}

export function VerificationPanel({ email, initialError }: { email: string; initialError?: string }) {
  const [message, setMessage] = useState(initialError ? "O link é inválido ou expirou. Gere um novo abaixo." : "");
  const [pending, setPending] = useState(false);

  async function resend() {
    if (!email) {
      setMessage("Informe seu e-mail voltando para a tela de entrada.");
      return;
    }
    setPending(true);
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const result = await response.json() as ApiResult;
    setMessage(result.message);
    setPending(false);
  }

  return <div className="mt-8">
    {message && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}
    <button onClick={resend} disabled={pending} className="btn-secondary mt-3 w-full">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Reenviar confirmação</button>
  </div>;
}
