import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asistente Inteligente Pro",
  description: "Plataforma de automatización empresarial",
};

import TopNav from "@/components/TopNav";
import FloatingChat from "@/components/FloatingChat";
import { getSession } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const permisos = session?.permisos || [];

  return (
    <html lang="es">
      <body>
        <TopNav permisos={permisos} />
        {children}
        {permisos.includes("ia") && <FloatingChat />}
      </body>
    </html>
  );
}
