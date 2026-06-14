'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useFirebaseAuth from '@/hooks/useFirebaseAuth';
import { useAppDispatch } from '@/redux/hooks';
import { RootState } from '@/redux/store';
import { login } from '@/redux/auth';
import { User, UserRole } from '@/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useFirebaseAuth();
  const dispatch = useAppDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  // Demo mode: when a shared api-key is configured there is no real Firebase
  // login, so we seed a BUSINESS_OWNER session matching the seeded demo owner.
  // In production (no NEXT_PUBLIC_DEMO_API_KEY) this is a no-op and the normal
  // Firebase login flow is used.
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_API_KEY && !isLoggedIn) {
      dispatch(
        login({
          id: 'demo-owner-uid',
          email: 'demo@graf.local',
          name: 'Demo Owner',
          role: UserRole.BUSINESS_OWNER,
          stores: [],
        } as unknown as User),
      );
    }
  }, [isLoggedIn, dispatch]);

  return <>{children}</>;
}
