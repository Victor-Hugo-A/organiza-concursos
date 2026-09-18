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
