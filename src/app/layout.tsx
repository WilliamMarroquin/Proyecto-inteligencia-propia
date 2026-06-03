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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <TopNav />
        {children}
        <FloatingChat />
      </body>
    </html>
  );
}
