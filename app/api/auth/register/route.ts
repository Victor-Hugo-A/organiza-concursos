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
    if (existente?.emailVerificadoEm) return fail("Já existe uma conta confirmada com este e-mail.", 409);

    const senhaHash = await bcrypt.hash(input.senha, 12);
    const usuario = existente
      ? await prisma.usuario.update({ where: { id: existente.id }, data: { nome: input.nome, senhaHash } })
      : await prisma.usuario.create({ data: { nome: input.nome, email, senhaHash } });

    await prisma.tokenVerificacao.deleteMany({ where: { usuarioId: usuario.id } });
    const token = createOpaqueToken();
    await prisma.tokenVerificacao.create({
      data: { usuarioId: usuario.id, tokenHash: hashToken(token), expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
    const verificationUrl = `${env.APP_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
    const delivery = await sendVerificationEmail(usuario.nome, usuario.email, verificationUrl);

    return created({
      email: usuario.email,
      emailEnviado: delivery.sent,
      verificationUrl: env.NODE_ENV === "development" ? verificationUrl : undefined
    }, delivery.sent ? "Conta criada. Confirme seu e-mail." : "Conta criada. Use o link local para confirmar.");
  } catch (error) {
    return handleApiError(error);
  }
}
