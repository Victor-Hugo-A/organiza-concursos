CREATE TABLE "MetaSemanal" ("id" TEXT NOT NULL, "usuarioId" TEXT NOT NULL, "minutosEstudo" INTEGER NOT NULL DEFAULT 0, "questoes" INTEGER NOT NULL DEFAULT 0, "atualizadoEm" TIMESTAMP(3) NOT NULL, CONSTRAINT "MetaSemanal_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "MetaSemanal_usuarioId_key" ON "MetaSemanal"("usuarioId");
ALTER TABLE "MetaSemanal" ADD CONSTRAINT "MetaSemanal_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
