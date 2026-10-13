import { randomUUID } from "node:crypto";
import { copy, del } from "@vercel/blob";
import { prisma } from "../lib/prisma";

function isPublicMaterialUrl(url: string, usuarioId: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".public.blob.vercel-storage.com") &&
      parsed.pathname.startsWith(`/materiais/${usuarioId}/`)
    );
  } catch {
    return false;
  }
}

async function registerPendingDeletion(usuarioId: string, urlArquivo: string, error: unknown) {
  await prisma.arquivoPendenteExclusao.upsert({
    where: { urlArquivo },
    create: {
      usuarioId,
      urlArquivo,
      tentativas: 1,
      ultimoErro: error instanceof Error ? error.message.slice(0, 500) : "Erro desconhecido"
    },
    update: {
      tentativas: { increment: 1 },
      ultimoErro: error instanceof Error ? error.message.slice(0, 500) : "Erro desconhecido"
    }
  });
}

async function main() {
  const materials = await prisma.materialEstudo.findMany({
    where: { urlArquivo: { contains: ".public.blob.vercel-storage.com/" } },
    select: { id: true, usuarioId: true, nomeArquivo: true, urlArquivo: true }
  });
  let migrated = 0;
  let failures = 0;

  for (const material of materials) {
    if (!material.urlArquivo || !isPublicMaterialUrl(material.urlArquivo, material.usuarioId)) {
      failures += 1;
      console.error(`URL pública inválida no material ${material.id}`);
      continue;
    }
    const filename = material.nomeArquivo?.replaceAll(/[^a-zA-Z0-9._ -]/g, "_") || "material.pdf";
    try {
      const blob = await copy(
        material.urlArquivo,
        `materiais/${material.usuarioId}/${randomUUID()}-${filename}`,
        { access: "private", addRandomSuffix: false, contentType: "application/pdf" }
      );
      await prisma.materialEstudo.update({
        where: { id: material.id },
        data: { urlArquivo: blob.url }
      });
      try {
        await del(material.urlArquivo);
      } catch (error) {
        await registerPendingDeletion(material.usuarioId, material.urlArquivo, error);
      }
      migrated += 1;
    } catch (error) {
      failures += 1;
      console.error(`Falha ao migrar o material ${material.id}`, error);
    }
  }

  console.info(`Migração concluída: ${migrated} migrados, ${failures} com falha.`);
  if (failures) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Não foi possível migrar os arquivos públicos", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
