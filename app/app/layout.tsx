import { StudyShell } from "@/components/study-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <StudyShell>{children}</StudyShell>;
}
