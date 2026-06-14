'use client';

import { ThemeProvider } from '@cauce/ui';
import { ReduxProvider } from './ReduxProvider';
import { AuthProvider } from './AuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <ReduxProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}