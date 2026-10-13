import { deleteMaterialFile } from "../lib/material-files";
import { prisma } from "../lib/prisma";

async function main() {
  const files = await prisma.arquivoPendenteExclusao.findMany({
    orderBy: { criadoEm: "asc" },
    take: 100
  });
  let failures = 0;

  for (const file of files) {
    try {
      await deleteMaterialFile(file.urlArquivo, file.usuarioId);
      await prisma.arquivoPendenteExclusao.delete({ where: { id: file.id } });
    } catch (error) {
      failures += 1;
      await prisma.arquivoPendenteExclusao.update({
        where: { id: file.id },
        data: {
          tentativas: { increment: 1 },
          ultimoErro: error instanceof Error ? error.message.slice(0, 500) : "Erro desconhecido"
        }
      });
      console.error(`Falha ao excluir ${file.urlArquivo}`, error);
    }
  }

  console.info(`Limpeza concluída: ${files.length - failures} removidos, ${failures} pendentes.`);
  if (failures) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Não foi possível executar a limpeza de arquivos", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
