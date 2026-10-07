CREATE TYPE "DificuldadeEstudo" AS ENUM ('FACIL', 'MEDIO', 'DIFICIL');

ALTER TABLE "MaterialEstudo"
ADD COLUMN "paginaAtual" INTEGER,
ADD COLUMN "concluidoEm" TIMESTAMP(3),
ADD COLUMN "ultimoAcessoEm" TIMESTAMP(3);

CREATE INDEX "MaterialEstudo_usuarioId_ultimoAcessoEm_idx"
ON "MaterialEstudo"("usuarioId", "ultimoAcessoEm");

CREATE TABLE "SessaoEstudoOrganiza" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" TIMESTAMP(3),
    "duracaoSegundos" INTEGER,
    "dificuldade" "DificuldadeEstudo",
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessaoEstudoOrganiza_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SessaoEstudoOrganiza_usuarioId_iniciadaEm_idx"
ON "SessaoEstudoOrganiza"("usuarioId", "iniciadaEm");

CREATE INDEX "SessaoEstudoOrganiza_materialId_iniciadaEm_idx"
ON "SessaoEstudoOrganiza"("materialId", "iniciadaEm");

CREATE INDEX "SessaoEstudoOrganiza_usuarioId_finalizadaEm_idx"
ON "SessaoEstudoOrganiza"("usuarioId", "finalizadaEm");

ALTER TABLE "SessaoEstudoOrganiza"
ADD CONSTRAINT "SessaoEstudoOrganiza_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SessaoEstudoOrganiza"
ADD CONSTRAINT "SessaoEstudoOrganiza_materialId_fkey"
FOREIGN KEY ("materialId") REFERENCES "MaterialEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
