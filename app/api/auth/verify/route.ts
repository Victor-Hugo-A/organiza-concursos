import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${env.APP_URL}/verificar-email?erro=token-ausente`);

  const registro = await prisma.tokenVerificacao.findUnique({
    where: { tokenHash: hashToken(token) }
  });
  if (!registro || registro.expiraEm <= new Date()) {
    return NextResponse.redirect(`${env.APP_URL}/verificar-email?erro=token-invalido`);
  }

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: registro.usuarioId }, data: { emailVerificadoEm: new Date() } }),
    prisma.tokenVerificacao.deleteMany({ where: { usuarioId: registro.usuarioId } })
  ]);
  return NextResponse.redirect(`${env.APP_URL}/entrar?verificado=1`);
}
