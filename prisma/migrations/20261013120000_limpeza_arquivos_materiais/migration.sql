CREATE TABLE "ArquivoPendenteExclusao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "ultimoErro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArquivoPendenteExclusao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArquivoPendenteExclusao_urlArquivo_key" ON "ArquivoPendenteExclusao"("urlArquivo");
CREATE INDEX "ArquivoPendenteExclusao_criadoEm_idx" ON "ArquivoPendenteExclusao"("criadoEm");

ALTER TABLE "ArquivoPendenteExclusao"
ADD CONSTRAINT "ArquivoPendenteExclusao_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
