import { Target } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanCreator } from "@/components/plan-creator";
import { PlansList } from "@/components/plans-list";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const plans = await prisma.planoEstudo.findMany({
    where: { usuarioId: user.id, arquivado: false },
    orderBy: { atualizadoEm: "desc" },
    include: {
      _count: {
        select: {
          materiais: { where: { materiaId: { not: null } } },
          materias: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            Planos de estudo
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">
            Meus planos
          </h1>
          <p className="mt-2 text-stone-600">
            Crie um plano para a prova que você vai fazer. Dentro dele, organize
            suas matérias e os PDFs de cada assunto.
          </p>
        </div>
        <PlanCreator />
      </div>

      {plans.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white/60 p-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
            <Target className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-stone-950">
            Crie seu primeiro plano
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
            Por exemplo: ENEM 2027 ou Concurso do Banco do Brasil. Depois,
            cadastre matérias como Português e Matemática e envie seus PDFs.
          </p>
          <div className="mt-5 flex justify-center">
            <PlanCreator />
          </div>
        </section>
      ) : (
        <PlansList plans={plans} />
      )}
    </div>
  );
}
