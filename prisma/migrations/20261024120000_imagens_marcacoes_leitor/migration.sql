ALTER TYPE "MaterialTipo" ADD VALUE 'IMAGEM';

CREATE TABLE "MarcacaoMaterial" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "pagina" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "estilo" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "posicoes" JSONB NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarcacaoMaterial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarcacaoMaterial_materialId_pagina_idx" ON "MarcacaoMaterial"("materialId", "pagina");

ALTER TABLE "MarcacaoMaterial" ADD CONSTRAINT "MarcacaoMaterial_materialId_fkey"
FOREIGN KEY ("materialId") REFERENCES "MaterialEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
