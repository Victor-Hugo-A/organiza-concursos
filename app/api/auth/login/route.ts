import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/strings";
import { fail, handleApiError, ok } from "@/lib/api-response";

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
  lembrar: z.boolean().default(false)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const usuario = await prisma.usuario.findUnique({ where: { email: normalizeEmail(input.email) } });
    if (!usuario || !(await bcrypt.compare(input.senha, usuario.senhaHash))) {
      return fail("E-mail ou senha incorretos.", 401);
    }
    if (!usuario.emailVerificadoEm) {
      return fail("Confirme seu e-mail antes de entrar.", 403, [{ code: "EMAIL_NOT_VERIFIED", email: usuario.email }]);
    }
    await createSession(usuario.id, input.lembrar);
    return ok({ nome: usuario.nome, email: usuario.email }, "Login realizado.");
  } catch (error) {
    return handleApiError(error);
  }
}
