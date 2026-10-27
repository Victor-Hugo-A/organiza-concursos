"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import { passwordError } from "@/lib/password-rules";
import { useToast } from "@/components/toast-provider";

type PasswordFieldProps = {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
};

function PasswordField({ name, label, autoComplete, placeholder }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <div className="relative mt-1.5">
        <input
          name={name}
          required
          minLength={name === "senhaAtual" ? undefined : 8}
          maxLength={72}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="pr-10"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute right-3 top-2.5 grid h-6 w-6 place-items-center text-stone-400 hover:text-stone-700"
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notify } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const senhaAtual = String(form.get("senhaAtual") ?? "");
    const novaSenha = String(form.get("novaSenha") ?? "");
    const confirmacao = String(form.get("confirmacao") ?? "");
    if (novaSenha !== confirmacao) {
      setError("As senhas não coincidem.");
      return;
    }
    if (novaSenha === senhaAtual) {
      setError("Escolha uma senha diferente da atual.");
      return;
    }
    const passwordMessage = passwordError(novaSenha);
    if (passwordMessage) {
      setError(passwordMessage);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha, confirmacao }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message ?? "Não foi possível alterar a senha.");
        return;
      }
      event.currentTarget.reset();
      onClose();
      notify("success", result.message ?? "Senha atualizada.");
    } catch {
      setError("Não foi possível acessar o servidor. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="change-password-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><KeyRound className="h-5 w-5" /></span>
            <div>
              <h2 id="change-password-title" className="text-xl font-semibold text-stone-950">Trocar senha</h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">Confirme sua senha atual antes de criar uma nova.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={pending} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label="Fechar alteração de senha"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
          <PasswordField name="senhaAtual" label="Senha atual" autoComplete="current-password" placeholder="Digite sua senha atual" />
          <PasswordField name="novaSenha" label="Nova senha" autoComplete="new-password" placeholder="Pelo menos 8 caracteres" />
          <PasswordField name="confirmacao" label="Confirmar nova senha" autoComplete="new-password" placeholder="Digite novamente" />
          <p className="flex gap-2 rounded-xl bg-stone-50 p-3 text-xs leading-5 text-stone-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />Por segurança, as outras sessões abertas nesta conta serão encerradas.</p>
          <div className="mt-1 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={pending} className="btn-secondary">Cancelar</button>
            <button disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Salvar nova senha</button>
          </div>
        </form>
      </section>
    </div>
  );
}
