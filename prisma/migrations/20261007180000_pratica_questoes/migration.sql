CREATE TABLE "QuestaoEstudo" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "topicoId" TEXT,
    "enunciado" TEXT NOT NULL,
    "alternativas" TEXT[] NOT NULL,
    "respostaCorreta" TEXT NOT NULL,
    "explicacao" TEXT,
    "dificuldade" "DificuldadeEstudo" NOT NULL DEFAULT 'MEDIO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestaoEstudo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TentativaQuestao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "respostaEscolhida" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL,
    "respondidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaQuestao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuestaoEstudo_usuarioId_criadoEm_idx" ON "QuestaoEstudo"("usuarioId", "criadoEm");
CREATE INDEX "QuestaoEstudo_materiaId_dificuldade_idx" ON "QuestaoEstudo"("materiaId", "dificuldade");
CREATE INDEX "QuestaoEstudo_topicoId_idx" ON "QuestaoEstudo"("topicoId");
CREATE INDEX "TentativaQuestao_usuarioId_respondidaEm_idx" ON "TentativaQuestao"("usuarioId", "respondidaEm");
CREATE INDEX "TentativaQuestao_questaoId_respondidaEm_idx" ON "TentativaQuestao"("questaoId", "respondidaEm");
CREATE INDEX "TentativaQuestao_usuarioId_questaoId_idx" ON "TentativaQuestao"("usuarioId", "questaoId");

ALTER TABLE "QuestaoEstudo" ADD CONSTRAINT "QuestaoEstudo_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestaoEstudo" ADD CONSTRAINT "QuestaoEstudo_materiaId_fkey"
FOREIGN KEY ("materiaId") REFERENCES "MateriaEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestaoEstudo" ADD CONSTRAINT "QuestaoEstudo_topicoId_fkey"
FOREIGN KEY ("topicoId") REFERENCES "TopicoEstudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TentativaQuestao" ADD CONSTRAINT "TentativaQuestao_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TentativaQuestao" ADD CONSTRAINT "TentativaQuestao_questaoId_fkey"
FOREIGN KEY ("questaoId") REFERENCES "QuestaoEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
