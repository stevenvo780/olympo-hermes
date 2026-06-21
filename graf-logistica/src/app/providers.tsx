"use client";

import { ThemeProvider, PrizmaRoot } from "prizma-ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="hermes-theme">
      <PrizmaRoot module="hermes">{children}</PrizmaRoot>
    </ThemeProvider>
  );
}
