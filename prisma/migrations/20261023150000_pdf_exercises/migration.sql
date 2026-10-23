ALTER TABLE "QuestaoEstudo"
ADD COLUMN "sourceMaterialId" TEXT,
ADD COLUMN "sourcePage" INTEGER,
ADD COLUMN "sourceKey" TEXT;

CREATE UNIQUE INDEX "QuestaoEstudo_sourceKey_key"
ON "QuestaoEstudo"("sourceKey");

CREATE INDEX "QuestaoEstudo_sourceMaterialId_idx"
ON "QuestaoEstudo"("sourceMaterialId");

ALTER TABLE "QuestaoEstudo"
ADD CONSTRAINT "QuestaoEstudo_sourceMaterialId_fkey"
FOREIGN KEY ("sourceMaterialId") REFERENCES "MaterialEstudo"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
