import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { normalizeEmail } from "@/lib/strings";
import { handleApiError, ok } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const { email: rawEmail } = z.object({ email: z.string().email() }).parse(await request.json());
    const email = normalizeEmail(rawEmail);
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || usuario.emailVerificadoEm) return ok({ emailEnviado: true }, "Se a conta estiver pendente, enviaremos um novo link.");

    await prisma.tokenVerificacao.deleteMany({ where: { usuarioId: usuario.id } });
    const token = createOpaqueToken();
    await prisma.tokenVerificacao.create({
      data: { usuarioId: usuario.id, tokenHash: hashToken(token), expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
    const verificationUrl = `${env.APP_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
    const delivery = await sendVerificationEmail(usuario.nome, email, verificationUrl);
    return ok({
      emailEnviado: delivery.sent,
      verificationUrl: env.NODE_ENV === "development" ? verificationUrl : undefined
    }, "Novo link gerado.");
  } catch (error) {
    return handleApiError(error);
  }
}
