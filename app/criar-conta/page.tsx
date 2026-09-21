import Link from "next/link";
import { Check } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { RegisterForm } from "@/components/auth-forms";

export const metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <main className="relative grid min-h-0 flex-1 place-items-center overflow-hidden px-5 py-4 lg:py-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_20px_60px_rgba(43,61,49,0.11)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="p-6 sm:p-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size="sm" />
            <span className="font-bold text-stone-950">Organiza</span>
          </Link>
          <div className="mt-6">
            <p className="text-sm font-semibold text-emerald-800">Comece do seu jeito</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-stone-950">Crie seu espaço de estudos</h1>
            <p className="mt-1 text-sm leading-6 text-stone-600">Depois, confirme seu e-mail para manter sua conta protegida.</p>
          </div>
          <RegisterForm />
          <p className="mt-5 text-center text-sm text-stone-600">
            Já tem conta? <Link href="/entrar" className="font-bold text-emerald-800">Entrar</Link>
          </p>
        </section>
        <section className="hidden bg-[#f1f8f3] p-8 lg:flex lg:flex-col">
          <div className="my-auto">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-emerald-800">Sem excesso</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.045em] text-stone-950">Uma base tranquila para estudar melhor.</h2>
            <ul className="mt-6 grid gap-3">
              {["Organize uma prova por vez", "Envie PDFs e slides", "Conecte palavras-chave aos seus materiais"].map((text) => (
                <li key={text} className="flex items-center gap-3 text-sm font-semibold text-stone-700">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-emerald-800"><Check className="h-4 w-4" /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
