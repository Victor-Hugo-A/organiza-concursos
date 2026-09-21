import { StudyShell } from "@/components/study-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const [pendingCount, dueToday, nextReview] = await Promise.all([
    prisma.revisao.count({
      where: { material: { usuarioId: user.id }, status: "PENDENTE" },
    }),
    prisma.revisao.count({
      where: {
        material: { usuarioId: user.id },
        status: "PENDENTE",
        agendadaPara: { lte: endOfToday },
      },
    }),
    prisma.revisao.findFirst({
      where: { material: { usuarioId: user.id }, status: "PENDENTE" },
      orderBy: { agendadaPara: "asc" },
      select: { titulo: true, agendadaPara: true },
    }),
  ]);
  return (
    <StudyShell
      user={{ nome: user.nome, email: user.email }}
      notifications={{
        pendingCount,
        dueToday,
        nextReview: nextReview
          ? { titulo: nextReview.titulo, agendadaPara: nextReview.agendadaPara.toISOString() }
          : null,
      }}
    >
      {children}
    </StudyShell>
  );
}
