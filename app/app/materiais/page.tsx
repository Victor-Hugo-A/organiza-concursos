import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaterialsManager } from "@/components/materials-manager";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [plans, materials] = await Promise.all([
    prisma.planoEstudo.findMany({ where: { usuarioId: user.id, arquivado: false }, orderBy: { titulo: "asc" }, select: { id: true, titulo: true } }),
    prisma.materialEstudo.findMany({ where: { usuarioId: user.id }, orderBy: { atualizadoEm: "desc" }, include: { plano: { select: { id: true, titulo: true } }, palavrasChave: { select: { id: true, termo: true } } } })
  ]);
  return <MaterialsManager plans={plans} initialMaterials={materials.map((material) => ({ ...material, atualizadoEm: material.atualizadoEm.toISOString() }))} />;
}
