ALTER TYPE "MaterialTipo" ADD VALUE IF NOT EXISTS 'TEXTO';
ALTER TYPE "MaterialTipo" ADD VALUE IF NOT EXISTS 'ANOTACAO';
ALTER TYPE "MaterialTipo" ADD VALUE IF NOT EXISTS 'LINK';

ALTER TABLE "MaterialEstudo"
ALTER COLUMN "nomeArquivo" DROP NOT NULL,
ALTER COLUMN "urlArquivo" DROP NOT NULL,
ADD COLUMN "urlExterna" TEXT,
ADD COLUMN "conteudo" TEXT;

CREATE INDEX "MaterialEstudo_usuarioId_tipo_idx" ON "MaterialEstudo"("usuarioId", "tipo");
