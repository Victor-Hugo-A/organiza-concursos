import type { Metadata } from "next";
import "./globals.css";
import { AppFooter } from "@/components/app-footer";
import { PublicHeader } from "@/components/public-header";

export const metadata: Metadata = {
  metadataBase: new URL("https://organizaseusestudos.example"),
  title: {
    default: "Organiza - Seu espaço de estudos",
    template: "%s | Organiza"
  },
  description: "Organize materiais, palavras-chave, revisões e planos para o ENEM, PAS e concursos.",
  openGraph: {
    title: "Organiza",
    description: "Seu espaço pessoal para estudar com clareza.",
    type: "website",
    locale: "pt_BR"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <PublicHeader />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <AppFooter />
      </body>
    </html>
  );
}
