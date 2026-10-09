import { z } from "zod";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ titulo: z.string().trim().min(2).max(150), conteudo: z.string().trim().min(1).max(20000), materiaId: z.string().min(1).nullable().optional() });

async function ownedNote(id: string, userId: string) { return prisma.anotacaoEstudo.findFirst({ where: { id, usuarioId: userId }, select: { id: true } }); }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await getCurrentUser(); if (!user) return fail("Entre na sua conta para editar uma anotação.", 401); const { id } = await params; if (!await ownedNote(id, user.id)) return fail("Anotação não encontrada.", 404); const input = schema.parse(await request.json()); const note = await prisma.anotacaoEstudo.update({ where: { id }, data: { titulo: input.titulo, conteudo: input.conteudo, materiaId: input.materiaId ?? null } }); return ok(note, "Anotação atualizada."); } catch (error) { return handleApiError(error); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await getCurrentUser(); if (!user) return fail("Entre na sua conta para excluir uma anotação.", 401); const { id } = await params; if (!await ownedNote(id, user.id)) return fail("Anotação não encontrada.", 404); await prisma.anotacaoEstudo.delete({ where: { id } }); return ok(null, "Anotação excluída."); } catch (error) { return handleApiError(error); } }
