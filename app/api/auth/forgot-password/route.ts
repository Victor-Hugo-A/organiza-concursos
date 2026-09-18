import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { normalizeEmail } from "@/lib/strings";
import { fail, handleApiError, ok } from "@/lib/api-response";

const schema = z.object({ email: z.string().email() });
const genericMessage = "Se existir uma conta com este e-mail, enviaremos as instruções de recuperação.";

export async function POST(request: Request) {
  try {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      return fail("O envio de e-mail ainda não foi configurado. Preencha RESEND_API_KEY e EMAIL_FROM.", 503);
    }
    const { email: rawEmail } = schema.parse(await request.json());
    const email = normalizeEmail(rawEmail);
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return ok({ emailEnviado: true }, genericMessage);

    await prisma.tokenRedefinicaoSenha.deleteMany({ where: { usuarioId: usuario.id } });
    const token = createOpaqueToken();
    await prisma.tokenRedefinicaoSenha.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hashToken(token),
        expiraEm: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    const resetUrl = `${env.APP_URL}/redefinir-senha?token=${encodeURIComponent(token)}`;
    const delivery = await sendPasswordResetEmail(usuario.nome, usuario.email, resetUrl);
    return ok({
      emailEnviado: delivery.sent
    }, genericMessage);
  } catch (error) {
    return handleApiError(error);
  }
}
