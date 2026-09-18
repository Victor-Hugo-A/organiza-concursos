CREATE TABLE IF NOT EXISTS "TokenRedefinicaoSenha" (
  "id" TEXT PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TokenRedefinicaoSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "TokenRedefinicaoSenha_usuarioId_idx" ON "TokenRedefinicaoSenha"("usuarioId");
CREATE INDEX IF NOT EXISTS "TokenRedefinicaoSenha_expiraEm_idx" ON "TokenRedefinicaoSenha"("expiraEm");
