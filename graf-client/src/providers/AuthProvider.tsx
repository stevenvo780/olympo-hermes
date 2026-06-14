'use client';

import React from 'react';
import useFirebaseAuth from '@/hooks/useFirebaseAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useFirebaseAuth();
  return <>{children}</>;
}