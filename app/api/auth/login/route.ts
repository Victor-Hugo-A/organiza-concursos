import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/strings";
import { fail, handleApiError, ok, tooManyRequests } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
  lembrar: z.boolean().default(false)
});

export async function POST(request: Request) {
  try {
    const limit = rateLimit(request, "login", { limit: 8, windowMs: 15 * 60 * 1000 });
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);
    const input = schema.parse(await request.json());
    const usuario = await prisma.usuario.findUnique({ where: { email: normalizeEmail(input.email) } });
    if (!usuario || !(await bcrypt.compare(input.senha, usuario.senhaHash))) {
      return fail("E-mail ou senha incorretos.", 401);
    }
    if (!usuario.emailVerificadoEm) {
      return Response.json(
        {
          success: false,
          message: "Confirme seu e-mail pelo link enviado antes de entrar.",
          data: { email: usuario.email, confirmationRequired: true },
        },
        { status: 403 },
      );
    }
    await createSession(usuario.id, input.lembrar);
    return ok({ nome: usuario.nome, email: usuario.email }, "Login realizado.");
  } catch (error) {
    return handleApiError(error);
  }
}
