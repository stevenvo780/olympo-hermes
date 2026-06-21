import type { Metadata } from "next";
import "./globals.css";
import "./prizma-brand.css";

export const metadata: Metadata = {
  title: "Hermes Logística — Despacho & Cargue · Prizma",
  description:
    "Hermes Logística, parte del ecosistema Prizma: cargue a camiones, tablero de despacho y tracking de transportadora. DB propia, integrada a Hermes.",
  applicationName: "Hermes Logística",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
    apple: "/brand/prizma-symbol.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="light" data-module="hermes">
      <body>{children}</body>
    </html>
  );
}
