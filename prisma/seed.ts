import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.info("Banco preparado para contas e espaços de estudo.");
}

main().finally(async () => prisma.$disconnect());
