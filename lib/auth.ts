import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "organiza_session";

function secret() {
  if (!env.APP_SECRET) throw new Error("APP_SECRET não foi configurado.");
  return env.APP_SECRET;
}

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export async function createSession(usuarioId: string, remember = false) {
  const token = createOpaqueToken();
  const expiraEm = new Date(Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000);
  await prisma.sessao.create({ data: { usuarioId, tokenHash: hashToken(token), expiraEm } });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await prisma.sessao.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sessao = await prisma.sessao.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: true }
  });
  if (!sessao || sessao.expiraEm <= new Date()) return null;
  return {
    id: sessao.usuario.id,
    nome: sessao.usuario.nome,
    email: sessao.usuario.email,
    emailVerificadoEm: sessao.usuario.emailVerificadoEm
  };
}
