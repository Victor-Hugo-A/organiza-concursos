import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verificado?: string; "senha-redefinida"?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="relative grid min-h-0 flex-1 place-items-center overflow-hidden px-5 py-4 lg:py-6">
      <div className="absolute -left-28 top-20 -z-10 h-80 w-80 rounded-full bg-emerald-100 blur-3xl" />
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_20px_60px_rgba(43,61,49,0.11)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-emerald-900 p-8 text-white lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size="sm" />
            <span className="font-bold">organiza</span>
          </Link>
          <div className="my-auto">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-emerald-300">Seu lugar de estudo</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.045em]">Volte para o que realmente importa.</h1>
            <p className="mt-4 text-sm leading-6 text-emerald-100">Seus materiais, palavras-chave e próximos passos esperam por você.</p>
          </div>
          <p className="flex items-center gap-2 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4" /> Tudo organizado ao seu ritmo.
          </p>
        </section>
        <section className="p-6 sm:p-8">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <BrandMark size="sm" />
              <span className="font-bold text-stone-950">organiza</span>
            </Link>
          </div>
          <div className="mt-6 lg:mt-0">
            <p className="text-sm font-semibold text-emerald-800">Que bom ter você de volta</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-stone-950">Entre na sua conta</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">Use seus dados para acessar seu espaço pessoal.</p>
          </div>
          <LoginForm
            verified={params.verificado === "1"}
            passwordReset={params["senha-redefinida"] === "1"}
          />
          <p className="mt-5 text-center text-sm text-stone-600">
            Ainda não tem conta? <Link href="/criar-conta" className="font-bold text-emerald-800">Criar minha conta</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
