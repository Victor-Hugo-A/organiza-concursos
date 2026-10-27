import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUser, hashToken, SESSION_COOKIE } from "@/lib/auth";
import { fail, handleApiError, ok, tooManyRequests } from "@/lib/api-response";
import { passwordError } from "@/lib/password-rules";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z
  .object({
    senhaAtual: z.string().min(1),
    novaSenha: z.string().min(8).max(72).refine((value) => !passwordError(value), {
      message: "Escolha uma senha mais segura.",
    }),
    confirmacao: z.string(),
  })
  .superRefine((value, context) => {
    if (value.novaSenha !== value.confirmacao) {
      context.addIssue({ code: "custom", message: "As senhas não coincidem.", path: ["confirmacao"] });
    }
    if (value.novaSenha === value.senhaAtual) {
      context.addIssue({ code: "custom", message: "Escolha uma senha diferente da atual.", path: ["novaSenha"] });
    }
  });

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Entre na sua conta para alterar a senha.", 401);

    const limit = rateLimit(request, "change-password", { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const input = schema.parse(await request.json());
    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { senhaHash: true },
    });
    if (!usuario || !(await bcrypt.compare(input.senhaAtual, usuario.senhaHash))) {
      return fail("A senha atual está incorreta.", 400);
    }

    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return fail("Sua sessão expirou. Entre novamente para alterar a senha.", 401);

    const senhaHash = await bcrypt.hash(input.novaSenha, 12);
    await prisma.$transaction([
      prisma.usuario.update({ where: { id: user.id }, data: { senhaHash } }),
      prisma.tokenRedefinicaoSenha.deleteMany({ where: { usuarioId: user.id } }),
      prisma.sessao.deleteMany({
        where: { usuarioId: user.id, tokenHash: { not: hashToken(token) } },
      }),
    ]);

    return ok(null, "Senha atualizada. As outras sessões da conta foram encerradas.");
  } catch (error) {
    return handleApiError(error);
  }
}
