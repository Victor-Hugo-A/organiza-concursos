import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Entre na sua conta para exportar seus dados." }, { status: 401 });
  const [plans, materials, notes, questions, attempts, reviews, sessions] = await Promise.all([
    prisma.planoEstudo.findMany({ where: { usuarioId: user.id }, include: { materias: { include: { topicos: true } } } }),
    prisma.materialEstudo.findMany({ where: { usuarioId: user.id }, select: { id: true, titulo: true, tipo: true, conteudo: true, urlExterna: true, planoId: true, materiaId: true, topicoId: true, criadoEm: true, atualizadoEm: true } }),
    prisma.anotacaoEstudo.findMany({ where: { usuarioId: user.id } }),
    prisma.questaoEstudo.findMany({ where: { usuarioId: user.id } }),
    prisma.tentativaQuestao.findMany({ where: { usuarioId: user.id } }),
    prisma.revisao.findMany({ where: { material: { usuarioId: user.id } } }),
    prisma.sessaoEstudo.findMany({ where: { usuarioId: user.id } }),
  ]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    ["Tipo", "Título", "Conteúdo / detalhe", "Criado em", "Atualizado em"],
    ...plans.map((plan) => ["Plano", plan.titulo, plan.descricao ?? "", plan.criadoEm, plan.atualizadoEm]),
    ...materials.map((material) => ["Material", material.titulo, material.conteudo ?? material.urlExterna ?? material.tipo, material.criadoEm, material.atualizadoEm]),
    ...notes.map((note) => ["Anotação", note.titulo, note.conteudo, note.criadoEm, note.atualizadoEm]),
    ...questions.map((question) => ["Questão", question.enunciado, `Resposta correta: ${question.respostaCorreta}`, question.criadoEm, question.atualizadoEm]),
    ...sessions.map((session) => ["Sessão de estudo", "", `${session.duracaoSegundos ?? 0} segundos`, session.iniciadaEm, session.finalizadaEm ?? ""]),
    ...reviews.map((review) => ["Revisão", review.titulo, review.status, review.criadoEm, review.concluidaEm ?? ""]),
    ...attempts.map((attempt) => ["Tentativa", attempt.correta ? "Resposta correta" : "Resposta incorreta", attempt.respostaEscolhida, attempt.respondidaEm, ""]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escape).join(";")).join("\n")}`;
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="organiza-meus-estudos-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
