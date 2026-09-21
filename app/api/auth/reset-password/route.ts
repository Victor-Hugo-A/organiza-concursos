import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { passwordError } from "@/lib/password-rules";

const schema = z.object({
  token: z.string().min(20),
  senha: z.string().min(8).max(72).refine((value) => !passwordError(value), {
    message: "Escolha uma senha mais segura.",
  })
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const registro = await prisma.tokenRedefinicaoSenha.findUnique({
      where: { tokenHash: hashToken(input.token) }
    });
    if (!registro || registro.expiraEm <= new Date()) {
      if (registro) await prisma.tokenRedefinicaoSenha.delete({ where: { id: registro.id } });
      return fail("Este link é inválido ou expirou. Solicite uma nova recuperação.", 400);
    }

    const senhaHash = await bcrypt.hash(input.senha, 12);
    await prisma.$transaction([
      prisma.usuario.update({ where: { id: registro.usuarioId }, data: { senhaHash } }),
      prisma.tokenRedefinicaoSenha.deleteMany({ where: { usuarioId: registro.usuarioId } }),
      prisma.sessao.deleteMany({ where: { usuarioId: registro.usuarioId } })
    ]);
    return ok(null, "Senha redefinida com sucesso.");
  } catch (error) {
    return handleApiError(error);
  }
}
