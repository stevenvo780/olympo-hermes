import type { Metadata } from "next";
import "./globals.css";
import "./cauce-brand.css";

export const metadata: Metadata = {
  title: "Graf Logística — Despacho & Cargue · Olympo",
  description:
    "Graf Logística, parte del ecosistema Olympo: cargue a camiones, tablero de despacho y tracking de transportadora. DB propia, integrada a Graf.",
  applicationName: "Graf Logística",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
    apple: "/brand/cauce-symbol.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="light" data-module="graf">
      <body>{children}</body>
    </html>
  );
}
