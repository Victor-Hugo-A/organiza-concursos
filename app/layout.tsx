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
      <body>
        <PublicHeader />
        <div className="min-h-screen">{children}</div>
        <AppFooter />
      </body>
    </html>
  );
}
