import { StudyShell } from "@/components/study-shell";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return <StudyShell user={{ nome: user.nome, email: user.email }}>{children}</StudyShell>;
}
