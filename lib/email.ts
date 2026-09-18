import { env } from "@/lib/env";

export async function sendVerificationEmail(nome: string, email: string, verificationUrl: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: "Confirme seu e-mail no Organiza",
      text: `Olá, ${nome}. Confirme seu e-mail para acessar seu espaço de estudos: ${verificationUrl} Este link expira em 24 horas.`,
      html: `<div style="font-family:Arial,sans-serif;color:#17201c;max-width:560px;margin:auto">
        <h1 style="color:#166534">Olá, ${nome}.</h1>
        <p>Confirme seu e-mail para acessar seu espaço de estudos.</p>
        <p><a href="${verificationUrl}" style="display:inline-block;background:#166534;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Confirmar meu e-mail</a></p>
        <p style="font-size:13px;color:#78716c">Este link expira em 24 horas.</p>
      </div>`
    })
  });

  if (!response.ok) throw new Error("Não foi possível enviar o e-mail de confirmação.");
  return { sent: true };
}

export async function sendPasswordResetEmail(nome: string, email: string, resetUrl: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: "Redefina sua senha no Organiza",
      text: `Olá, ${nome}. Recebemos uma solicitação para redefinir sua senha. Crie uma nova senha neste endereço: ${resetUrl} O link expira em 1 hora. Se você não fez a solicitação, ignore este e-mail.`,
      html: `<div style="font-family:Arial,sans-serif;color:#17201c;max-width:560px;margin:auto">
        <div style="background:#166534;border-radius:18px 18px 0 0;padding:24px;color:white">
          <strong style="font-size:20px">organiza</strong>
        </div>
        <div style="border:1px solid #e7e5e4;border-top:0;border-radius:0 0 18px 18px;padding:28px">
          <h1 style="font-size:24px;margin:0 0 16px">Olá, ${nome}.</h1>
          <p style="line-height:1.6">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p style="margin:24px 0"><a href="${resetUrl}" style="display:inline-block;background:#166534;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Criar nova senha</a></p>
          <p style="font-size:13px;color:#78716c;line-height:1.5">Este link é válido por 1 hora e só pode ser usado uma vez. Se você não solicitou a troca, ignore este e-mail.</p>
        </div>
      </div>`
    })
  });

  if (!response.ok) throw new Error("Não foi possível enviar o e-mail de recuperação.");
  return { sent: true };
}
