CREATE TABLE "TopicoEstudo" (
    "id" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "topicoPaiId" TEXT,
    "titulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicoEstudo_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MaterialEstudo" ADD COLUMN "topicoId" TEXT;

CREATE INDEX "TopicoEstudo_materiaId_topicoPaiId_ordem_idx"
ON "TopicoEstudo"("materiaId", "topicoPaiId", "ordem");

CREATE UNIQUE INDEX "TopicoEstudo_materiaId_topicoPaiId_titulo_key"
ON "TopicoEstudo"("materiaId", "topicoPaiId", "titulo");

CREATE INDEX "MaterialEstudo_topicoId_idx" ON "MaterialEstudo"("topicoId");

ALTER TABLE "TopicoEstudo"
ADD CONSTRAINT "TopicoEstudo_materiaId_fkey"
FOREIGN KEY ("materiaId") REFERENCES "MateriaEstudo"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicoEstudo"
ADD CONSTRAINT "TopicoEstudo_topicoPaiId_fkey"
FOREIGN KEY ("topicoPaiId") REFERENCES "TopicoEstudo"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaterialEstudo"
ADD CONSTRAINT "MaterialEstudo_topicoId_fkey"
FOREIGN KEY ("topicoId") REFERENCES "TopicoEstudo"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
