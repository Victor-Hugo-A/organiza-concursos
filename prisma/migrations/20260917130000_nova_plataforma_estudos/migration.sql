DO $$ BEGIN
  CREATE TYPE "PlanoTipo" AS ENUM ('ENEM', 'PAS', 'CONCURSO_PUBLICO', 'VESTIBULAR', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MaterialTipo" AS ENUM ('PDF', 'SLIDE', 'DOCUMENTO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RevisaoStatus" AS ENUM ('PENDENTE', 'CONCLUIDA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Sessao" (
  "id" TEXT PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");
CREATE INDEX IF NOT EXISTS "Sessao_expiraEm_idx" ON "Sessao"("expiraEm");

CREATE TABLE IF NOT EXISTS "TokenVerificacao" (
  "id" TEXT PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TokenVerificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "TokenVerificacao_usuarioId_idx" ON "TokenVerificacao"("usuarioId");
CREATE INDEX IF NOT EXISTS "TokenVerificacao_expiraEm_idx" ON "TokenVerificacao"("expiraEm");

CREATE TABLE IF NOT EXISTS "PlanoEstudo" (
  "id" TEXT PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "tipo" "PlanoTipo" NOT NULL DEFAULT 'OUTRO',
  "descricao" TEXT,
  "cor" TEXT NOT NULL DEFAULT '#166534',
  "arquivado" BOOLEAN NOT NULL DEFAULT false,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanoEstudo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PlanoEstudo_usuarioId_arquivado_idx" ON "PlanoEstudo"("usuarioId", "arquivado");

CREATE TABLE IF NOT EXISTS "MateriaEstudo" (
  "id" TEXT PRIMARY KEY,
  "planoId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "MateriaEstudo_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoEstudo"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "MateriaEstudo_planoId_ordem_idx" ON "MateriaEstudo"("planoId", "ordem");

CREATE TABLE IF NOT EXISTS "MaterialEstudo" (
  "id" TEXT PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "planoId" TEXT,
  "materiaId" TEXT,
  "titulo" TEXT NOT NULL,
  "nomeArquivo" TEXT NOT NULL,
  "urlArquivo" TEXT NOT NULL,
  "tipo" "MaterialTipo" NOT NULL DEFAULT 'PDF',
  "tamanhoBytes" INTEGER,
  "paginas" INTEGER,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaterialEstudo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "MaterialEstudo_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoEstudo"("id") ON DELETE SET NULL,
  CONSTRAINT "MaterialEstudo_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "MateriaEstudo"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "MaterialEstudo_usuarioId_criadoEm_idx" ON "MaterialEstudo"("usuarioId", "criadoEm");
CREATE INDEX IF NOT EXISTS "MaterialEstudo_planoId_idx" ON "MaterialEstudo"("planoId");
CREATE INDEX IF NOT EXISTS "MaterialEstudo_materiaId_idx" ON "MaterialEstudo"("materiaId");

CREATE TABLE IF NOT EXISTS "PalavraChave" (
  "id" TEXT PRIMARY KEY,
  "materialId" TEXT NOT NULL,
  "termo" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PalavraChave_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialEstudo"("id") ON DELETE CASCADE,
  CONSTRAINT "PalavraChave_materialId_termo_key" UNIQUE ("materialId", "termo")
);
CREATE INDEX IF NOT EXISTS "PalavraChave_termo_idx" ON "PalavraChave"("termo");

CREATE TABLE IF NOT EXISTS "Revisao" (
  "id" TEXT PRIMARY KEY,
  "materialId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "agendadaPara" TIMESTAMP(3) NOT NULL,
  "concluidaEm" TIMESTAMP(3),
  "status" "RevisaoStatus" NOT NULL DEFAULT 'PENDENTE',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Revisao_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialEstudo"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Revisao_agendadaPara_status_idx" ON "Revisao"("agendadaPara", "status");
CREATE INDEX IF NOT EXISTS "Revisao_materialId_idx" ON "Revisao"("materialId");
