'use client';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/auth';
import { auth } from '../utils/firebase';
import { AppDispatch } from '../redux/store';

const useFirebaseAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
};

export default useFirebaseAuth;
