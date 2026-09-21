import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { normalizeEmail } from "@/lib/strings";
import { created, fail, handleApiError } from "@/lib/api-response";

const schema = z.object({
  nome: z.string().trim().min(2).max(80),
  email: z.string().email(),
  senha: z.string().min(8).max(72)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = normalizeEmail(input.email);
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente)
      return fail(
        "Este e-mail já está em uso. Entre na conta ou recupere sua senha.",
        409,
      );
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      return fail("O envio de confirmação ainda não foi configurado.", 503);
    }
    const senhaHash = await bcrypt.hash(input.senha, 12);
    const usuario = await prisma.usuario.create({
      data: { nome: input.nome, email, senhaHash },
    });

    await prisma.tokenVerificacao.deleteMany({ where: { usuarioId: usuario.id } });
    const token = createOpaqueToken();
    await prisma.tokenVerificacao.create({
      data: { usuarioId: usuario.id, tokenHash: hashToken(token), expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
    const verificationUrl = `${env.APP_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
    const delivery = await sendVerificationEmail(usuario.nome, usuario.email, verificationUrl);

    return created({
      email: usuario.email,
      emailEnviado: delivery.sent
    }, `Conta criada. Enviamos a confirmação para ${usuario.email}.`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    )
      return fail(
        "Este e-mail já está em uso. Entre na conta ou recupere sua senha.",
        409,
      );
    return handleApiError(error);
  }
}
