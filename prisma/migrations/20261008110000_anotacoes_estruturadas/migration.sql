CREATE TABLE "AnotacaoEstudo" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "planoId" TEXT,
  "materiaId" TEXT,
  "topicoId" TEXT,
  "materialId" TEXT,
  "sessaoEstudoId" TEXT,
  "titulo" TEXT NOT NULL,
  "conteudo" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnotacaoEstudo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AnotacaoEstudo_usuarioId_atualizadoEm_idx" ON "AnotacaoEstudo"("usuarioId", "atualizadoEm");
CREATE INDEX "AnotacaoEstudo_materiaId_idx" ON "AnotacaoEstudo"("materiaId");
CREATE INDEX "AnotacaoEstudo_materialId_idx" ON "AnotacaoEstudo"("materialId");
ALTER TABLE "AnotacaoEstudo" ADD CONSTRAINT "AnotacaoEstudo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnotacaoEstudo" ADD CONSTRAINT "AnotacaoEstudo_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoEstudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnotacaoEstudo" ADD CONSTRAINT "AnotacaoEstudo_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "MateriaEstudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnotacaoEstudo" ADD CONSTRAINT "AnotacaoEstudo_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "TopicoEstudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnotacaoEstudo" ADD CONSTRAINT "AnotacaoEstudo_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialEstudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnotacaoEstudo" ADD CONSTRAINT "AnotacaoEstudo_sessaoEstudoId_fkey" FOREIGN KEY ("sessaoEstudoId") REFERENCES "SessaoEstudoOrganiza"("id") ON DELETE SET NULL ON UPDATE CASCADE;
